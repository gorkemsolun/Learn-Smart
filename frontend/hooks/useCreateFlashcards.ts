import { useState } from "react";
import { backendAPI } from "@/environment/backend_api";
// import { toast } from "react-toastify";

export const useGenerateFlashcard = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<any>(null);
  const [flashcardData, setFlashcardData] = useState<any>(null);

  const generateFlashcard = async (chat_id: string, token: string) => {
    setIsLoading(true);
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
      console.log(response.data);
    } catch (error) {
      setError(error);
      // toast.error(error?.response?.data?.detail || "Error generating flashcard");
    } finally {
      setIsLoading(false);
    }
  };

  return { generateFlashcard, isLoading, error, flashcardData };
};