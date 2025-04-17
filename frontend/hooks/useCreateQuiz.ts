import { useState } from "react";
import { backendAPI } from "@/environment/backend_api";

export const useGenerateQuiz = () => {
  const [isLoadingQ, setIsLoading] = useState<boolean>(false);
  const [errorQ, setError] = useState<any>(null);
  const [quizData, setQuizData] = useState<any>(null);

  const generateQuiz = async (chat_id: string, token: string) => {
    setIsLoading(true);
    try {
      const response = await backendAPI.post(
        `/chat/${chat_id}/create_quiz`,
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
    } catch (error) {
      setError(error);
    } finally {
      setIsLoading(false);
    }
  };

  return { generateQuiz, isLoadingQ, errorQ, quizData };
}