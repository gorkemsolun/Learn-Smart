"use client";

import { chatService } from "@/environment/backend_api";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import Cookies from "js-cookie";
import { useCheckSubscription } from "@/hooks/useCheckSubscription";

// This should be called when a new chat is attempted to be created
export function useCheckChatCreation() {
  const { toast } = useToast();
  const [token] = useState<string>(Cookies.get("authToken") as string);
  const { checkSubscription } = useCheckSubscription();

const checkChatCount = async (course_id: string) => {
    try {
    const response = await chatService.get(`/course/${course_id}/chats`, {
        headers: { Authorization: `Bearer ${token}` },
    });

    return response.data.length;
    
    } catch (error) {
    console.error(error);
    return false;
    }
};

  const checkChatCreation = async (course_id: string) => {
    try {
      const subscription_tier = await checkSubscription();
      const chatCount = await checkChatCount(course_id);

      if (subscription_tier == 'free' && chatCount >= 5) {
        toast({
            title: "Error",
            description: "You have reached the chat limit for this subscription tier",
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

  return { checkChatCreation };
}