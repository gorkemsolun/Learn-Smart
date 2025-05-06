"use client";

import { Course } from "@/app/types";
import { userService } from "@/environment/backend_api";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import Cookies from "js-cookie";
import { useCheckSubscription } from "@/hooks/useCheckSubscription";

export function useCheckCourseCount() {
  const { toast } = useToast();
  const [token] = useState<string>(Cookies.get("authToken") as string);
  const { checkSubscription } = useCheckSubscription();

  const checkCourseCount = async () => {
    try {
      const response = await userService.get(`/user`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // const subscription_tier = await checkSubscription();
      const courseCount = response.data.courses.length;
      return courseCount;
      
    } catch (error) {
      console.error("Error checking course code:", error);
      return false;
    }
  };

  return { checkCourseCount };
}