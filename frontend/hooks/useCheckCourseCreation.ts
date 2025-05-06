"use client";

import { userService } from "@/environment/backend_api";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import Cookies from "js-cookie";
import { useCheckSubscription } from "@/hooks/useCheckSubscription";
import { useCheckCourseCount } from "@/hooks/useCheckCourseCount";

// This should be called when a new course is attempted to be created
export function useCheckCourseCreation() {
  const { toast } = useToast();
  const [token] = useState<string>(Cookies.get("authToken") as string);
  const { checkSubscription } = useCheckSubscription();
  const { checkCourseCount } = useCheckCourseCount();

  const checkCourseCreation = async () => {
    try {
        /*
      const response = await userService.get(`/user`, {
        headers: { Authorization: `Bearer ${token}` },
      });*/

      const subscription_tier = await checkSubscription();
      const courseCount = await checkCourseCount();

      console.log(subscription_tier)
      console.log(courseCount)

      if (subscription_tier == 'basic' && courseCount >= 3) {
        toast({
            title: "Error",
            description: "You have reached the course limit for this subscription tier",
            variant: "destructive",
            duration: 3000,
          });
        return false;
      }
      return true;
    } catch (error) {
      console.error("Error checking course creation availability:", error);
      return false;
    }
  };

  return { checkCourseCreation };
}