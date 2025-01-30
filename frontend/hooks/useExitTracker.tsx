import { useEffect, useRef } from "react";
import Cookies from "js-cookie";
import { backendAPI } from "@/environment/backend_api";

export default function useExitTracker() {
  const hasExited = useRef(false);

  useEffect(() => {
    const handleExit = async (useBeacon = false) => {
      if (hasExited.current) return; // Prevent duplicate calls
      hasExited.current = true;

      const token = Cookies.get("authToken");
      const signInTime = Cookies.get("signin_time");

      if (!token || !signInTime) return;

      const signInDate = new Date(signInTime);
      if (isNaN(signInDate.getTime())) {
        console.error("Invalid sign-in time format");
        return;
      }

      const timeDifferenceInSeconds = Math.floor((Date.now() - signInDate.getTime()) / 1000);

      const data = {
        date: new Date().toISOString().split("T")[0], // 'YYYY-MM-DD'
        time_spent: timeDifferenceInSeconds,
        timestamp: new Date(signInTime).toISOString(),
      };

      try {
        if (useBeacon) {
          const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
          navigator.sendBeacon(`${backendAPI.defaults.baseURL}/analytics/log`, blob);
        } else {
          const response = await backendAPI.post(`/analytics/log`, data, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });
          console.log(response);
        }
        Cookies.set("signin_time", new Date().toISOString(), { path: "/" });
      } catch (error) {
        console.error("Error logging exit data:", error);
      }
    };

    const visibilityChangeHandler = () => {
      if (document.hidden) {
        handleExit();
      }
    };

    const beforeUnloadHandler = (event) => {
      handleExit(true);
      event.preventDefault();
    };

    document.addEventListener("visibilitychange", visibilityChangeHandler);
    window.addEventListener("beforeunload", beforeUnloadHandler);

    return () => {
      document.removeEventListener("visibilitychange", visibilityChangeHandler);
      window.removeEventListener("beforeunload", beforeUnloadHandler);
    };
  }, []);
}
