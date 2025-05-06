"use client";

import { Course } from "@/app/types";
import { subscriptionService } from "@/environment/backend_api";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import Cookies from "js-cookie";

export function useCheckSubscription() {
  const { toast } = useToast();
  const [token] = useState<string>(Cookies.get("authToken") as string);

  const checkSubscription = async () => {
    try {
      const response = await subscriptionService.get(`/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      return response.data["subscription_tier"];

    } catch (error) {
      console.error("Error fetching subscription tier !!!111!1!:", error);
    }
  };

  return { checkSubscription };
}