import { backendAPI } from "@/environment/backend_api";
import { useEffect, useState } from "react";
import { FlashcardModalParameters } from "../../types";
import FlashcardsPage from "@/app/flashcards/page";

const FlashcardModal = (modalParameters: FlashcardModalParameters) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); // Ensure error state is a string or null
  const [flashcardData, setFlashcardData] = useState(null);

  const handleClose = () => {
    setFlashcardData(null);
    setError(null); // Reset error state on close
    modalParameters.onClose(); // Trigger the parent close function
  };

  const fetchFlashcard = async (flashcardName: string) => {
    await backendAPI
      .get(`/chat/${modalParameters.chat_id}/flashcards/${flashcardName}`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${modalParameters.token}`,
          "Content-Type": "application/json",
        },
      })
      .then((response) => {
        setFlashcardData(response.data.content);
        setIsLoading(false);
      })
      .catch((error) => {
        setError(error.message); // Set error message here
        setIsLoading(false);
      });
  };

  useEffect(() => {
    if (modalParameters.isOpen) {
      setIsLoading(true);
      fetchFlashcard(modalParameters.flashcardName);
    }
  }, [modalParameters.isOpen]);

  if (!modalParameters.isOpen) return null; // Prevent rendering if modal is not open

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">

            <div className="bg-white w-[1500px] h-[800px] rounded-lg shadow-lg overflow-hidden relative flex justify-center items-center">
                {/* Close Button */}
                <button
                    onClick={() => handleClose()}
                    className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                    aria-label="Close"
                    type="button"
                >
                    &#10005; {/* This is the Unicode character for an "X" symbol */}
                </button>
                {flashcardData ? (
                    <div className="overflow-y-auto max-h-full">
                        <FlashcardsPage flashcardData={flashcardData} onClose={() => handleClose()} />
                    </div>
                ) : isLoading ? (
                    <div className="p-8 flex items-center justify-center h-full">Loading the flashcard for you...</div>
                ) : (
                    <div className="p-8">Error loading flashcard data: {error?.message}</div>
                )}
            </div>
        </div>
  );
};

export default FlashcardModal;
