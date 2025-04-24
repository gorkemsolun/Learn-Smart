"use client";

import { useEffect, useRef } from "react";
import Cookies from "js-cookie";
import { backendAPI } from "@/environment/backend_api";

export default function useExitTracker() {
  const hasExited = useRef(false);

  useEffect(() => {
    // Check for and send any pending analytics data
    const sendPendingAnalytics = () => {
      const pendingAnalytics = JSON.parse(localStorage.getItem("pendingAnalytics") || "[]");
      if (pendingAnalytics.length > 0) {
        pendingAnalytics.forEach((item, index) => {
          fetch(item.url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${item.token}`,
            },
            body: JSON.stringify(item.data),
          })
            .then(() => {
              // Remove this item from pending analytics
              pendingAnalytics.splice(index, 1);
              localStorage.setItem("pendingAnalytics", JSON.stringify(pendingAnalytics));
            })
            .catch((error) => console.error("Failed to send pending analytics:", error));
        });
      }
    };

    // Try to send any pending analytics when the component mounts
    if (window.navigator.onLine) {
      sendPendingAnalytics();
    }

    // Also listen for when the user comes back online
    const handleOnline = () => {
      sendPendingAnalytics();
    };

    window.addEventListener("online", handleOnline);

    // Set signin time if not already set
    if (!Cookies.get("signin_time")) {
      Cookies.set("signin_time", new Date().toISOString(), { path: "/" });
    }

    const handleExit = async () => {
      if (hasExited.current) return;
      hasExited.current = true;

      const token = Cookies.get("authToken");
      const signInTime = Cookies.get("signin_time");

      if (!token || !signInTime) return;

      const signInDate = new Date(signInTime);
      if (isNaN(signInDate.getTime())) {
        console.error("Invalid sign-in time format");
        return;
      }

      // Calculate the exit time (current time)
      const exitTime = new Date();
      // Store the exit time for debugging and verification
      const exitTimeISO = exitTime.toISOString();
      // Calculate time difference in seconds between sign-in and exit
      const timeDifferenceInSeconds = Math.floor((exitTime.getTime() - signInDate.getTime()) / 1000);

      const data = {
        date: exitTime.toISOString().split("T")[0], // 'YYYY-MM-DD'
        time_spent: timeDifferenceInSeconds,
        timestamp: new Date(signInTime).toISOString(),
        exit_timestamp: exitTimeISO, // Add the exit timestamp for more accurate tracking
      };

      // For beforeunload events, use fetch with keepalive
      if (window.navigator.onLine) {
        try {
          // Log the exit time and duration for debugging
          console.log(
            `Exit detected - Duration: ${timeDifferenceInSeconds}s, Sign-in: ${signInTime}, Exit: ${exitTimeISO}`,
          );

          // Use fetch with keepalive flag which is designed for this scenario
          fetch(`${backendAPI.defaults.baseURL}/analytics/log`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(data),
            // The keepalive flag keeps the request alive even when the page is unloading
            keepalive: true,
          });

          // Reset signin time for next session
          Cookies.set("signin_time", new Date().toISOString(), { path: "/" });
        } catch (error) {
          console.error("Error logging exit data:", error);
        }
      } else {
        // If offline, store the analytics data to send later
        const pendingAnalytics = JSON.parse(localStorage.getItem("pendingAnalytics") || "[]");
        pendingAnalytics.push({
          url: `${backendAPI.defaults.baseURL}/analytics/log`,
          data,
          token,
        });
        localStorage.setItem("pendingAnalytics", JSON.stringify(pendingAnalytics));
      }
    };

    const visibilityChangeHandler = () => {
      if (document.hidden) {
        handleExit();
      } else {
        // User returned to the page, reset the exit flag and update signin time
        hasExited.current = false;
        Cookies.set("signin_time", new Date().toISOString(), { path: "/" });
      }
    };

    const beforeUnloadHandler = () => {
      handleExit();
    };

    document.addEventListener("visibilitychange", visibilityChangeHandler);
    window.addEventListener("beforeunload", beforeUnloadHandler);

    return () => {
      document.removeEventListener("visibilitychange", visibilityChangeHandler);
      window.removeEventListener("beforeunload", beforeUnloadHandler);
      window.removeEventListener("online", handleOnline);
    };
  }, []);
}
