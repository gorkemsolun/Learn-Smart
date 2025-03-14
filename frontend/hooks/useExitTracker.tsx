import { useEffect, useRef } from "react";
import Cookies from "js-cookie";
import { backendAPI, userService } from "@/environment/backend_api";

export default function useExitTracker() {
  const hasExited = useRef(false);

  useEffect(() => {
    const handleExit = async () => {
      if (hasExited.current) return;
      hasExited.current = true;

      const token = Cookies.get("authToken");
      const signInTime = Cookies.get("signin_time");
      const signOutTime = Cookies.get("signout_time")

      if (!token || !signInTime) return;

      const signInDate = new Date(signInTime);
      const signOutDate = new Date(signOutTime);
      if (isNaN(signInDate.getTime())) {
        console.error("Invalid sign-in time format");
        return;
      }

      let timeDifferenceInSeconds;

      if(signOutTime)
        timeDifferenceInSeconds = Math.floor((signOutDate.getTime() - signInDate.getTime()) / 1000);
      else
        timeDifferenceInSeconds = Math.floor((Date.now() - signInDate.getTime()) / 1000);

      const data = {
        date: new Date().toISOString().split("T")[0], // 'YYYY-MM-DD'
        time_spent: timeDifferenceInSeconds,
        timestamp: new Date(signInTime).toISOString(),
      };

      try {
        await userService.post(`/analytics`, data, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        Cookies.set("signin_time", new Date().toISOString(), { path: "/" });
        Cookies.remove("signout_time");
      } catch (error) {
        console.error("Error logging exit data:", error);
      }
    };

    const visibilityChangeHandler = () => {
      if (document.hidden) {
        handleExit();
      }
    };

    const beforeUnloadHandler = () => {
      Cookies.set("signout_time", new Date().toISOString(), { path: "/" });
      handleExit();
    };

    document.addEventListener("visibilitychange", visibilityChangeHandler);
    window.addEventListener("beforeunload", beforeUnloadHandler);

    return () => {
      document.removeEventListener("visibilitychange", visibilityChangeHandler);
      window.removeEventListener("beforeunload", beforeUnloadHandler);
    };
  }, []);
}
