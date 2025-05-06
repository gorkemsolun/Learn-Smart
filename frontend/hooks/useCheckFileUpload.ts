"use client";

import { chatService } from "@/environment/backend_api";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import Cookies from "js-cookie";
import { useCheckSubscription } from "@/hooks/useCheckSubscription";

// This should be called when a new chat is attempted to be created
export function useCheckFileUpload() {
  const { toast } = useToast();
  const [token] = useState<string>(Cookies.get("authToken") as string);
  const { checkSubscription } = useCheckSubscription();

const checkFileCount = async (chat_id: string) => {
    try {
    const response = await chatService.get(`/chat/${chat_id}`, {
        headers: { Authorization: `Bearer ${token}` },
    });

    return response.data.slides.length;
    
    } catch (error) {
        console.error(error);
    }
};

  const checkFileUpload = async (chat_id: string) => {
    try {
      const subscription_tier = await checkSubscription();
      const fileCount = await checkFileCount(chat_id);

      if (subscription_tier == 'free' && fileCount >= 3) {
        toast({
            title: "Error",
            description: "You have reached the file limit for this subscription tier",
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

  return { checkFileUpload };
}