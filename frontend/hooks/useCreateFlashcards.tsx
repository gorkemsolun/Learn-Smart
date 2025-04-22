"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { backendAPI } from "@/environment/backend_api";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";

export const useGenerateFlashcard = () => {
  const [isLoadingFlashcard, setIsLoading] = useState<boolean>(false);
  const [errorFlashcard, setError] = useState<any>(null);
  const [flashcardData, setFlashcardData] = useState<any>(null);

  const { toast } = useToast();
  const router = useRouter(); // For navigation

  const generateFlashcard = async (course_id: string, chat_id: string, token: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await backendAPI.post(
        `/chat/${chat_id}/create_flashcards`,
        {},
        {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setFlashcardData(response.data.combined_data);
      toast({
        title: "Success",
        description: "Your flashcard has been created successfully.",
        variant: "default",
        action: (
          <ToastAction
            altText="View Flashcards"
            onClick={() => router.push(`/course/${course_id}/flashcards`)}
          >
            View
          </ToastAction>
        ),
      });
    } catch (error: any) {
      setError(error);

      toast({
        title: "Error",
        description: error?.response?.data?.detail || "Error generating flashcards",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return { generateFlashcard, isLoadingFlashcard, errorFlashcard, flashcardData };
};
