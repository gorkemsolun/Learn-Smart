"use client";

import { useState } from "react";
import { chatService } from "@/environment/backend_api";
import { useToast } from "@/hooks/use-toast";
import {ToastAction} from "@/components/ui/toast";
import { useRouter } from "next/navigation";

export const useGenerateQuiz = () => {
  const [isLoadingQuiz, setIsLoading] = useState<boolean>(false);
  const [errorQuiz, setError] = useState<any>(null);
  const [quizData, setQuizData] = useState<any>(null);
  const router = useRouter();
  const { toast } = useToast();

  const generateQuiz = async (course_id: string, chat_id: string, token: string) => {
    setIsLoading(true);
    try {
      const response = await chatService.post(
        `/quiz?chat_id=${chat_id}`,
        {},
        {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      setQuizData(response.data.combined_data);
      toast({
        title: "Success",
        description: "Your quiz has been created successfully.",
        variant: "default",
        action: <ToastAction altText="View Flashcards" onClick={() => router.push(`/course/${course_id}/quizzes`)}>View</ToastAction>,
      });
    } catch (error: any) {
      setError(error);
      toast({
        title: "Error",
        description: "Error generating quiz because of lack of meaningful discussion.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return { generateQuiz, isLoadingQuiz, errorQuiz, quizData };
};
