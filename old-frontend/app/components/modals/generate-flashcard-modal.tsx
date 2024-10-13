import { backendAPI } from "@/environment/backend_api";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { GenerateFlashcardModalParameters } from "../../types";
import FlashcardsPage from "@/app/flashcards/page";

const GenerateFlashcardModal = (modalParameters: GenerateFlashcardModalParameters) => {
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState(null);
    const [flashcardData, setFlashcardData] = useState(null);

    const handleClose = (err: any) => {
        setFlashcardData(null);
        modalParameters.onClose(err);
    }

    const generateFlashcard = async (chat_id: string, token: string) => {
        await backendAPI.post(
            `/chat/${chat_id}/create_flashcards`,
            {},
            {
                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            }
        ).then((response) => {
            setFlashcardData(response.data.combined_data);
            console.log(response.data);
            setIsLoading(false);
        }).catch((error) => {
            setError(error);
            setIsLoading(false);
            toast.error(error?.response?.data?.detail || "Error generating flashcard");
            handleClose(error);
        });

    };

    useEffect(() => {
        if (modalParameters.isOpen) {
            setIsLoading(true);
            console.log("helolo");
            generateFlashcard(modalParameters.chatID, modalParameters.token);
        }
    }, [modalParameters.isOpen]);

    if (!modalParameters.isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">

            <div className="bg-white w-[1500px] h-[800px] rounded-lg shadow-lg overflow-hidden relative flex justify-center items-center">
                {/* Close Button */}
                <button
                    onClick={() => handleClose(null)}
                    className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                    aria-label="Close"
                    type="button"
                >
                    &#10005; {/* This is the Unicode character for an "X" symbol */}
                </button>
                {flashcardData ? (
                    <div className="overflow-y-auto max-h-full">
                        <FlashcardsPage flashcardData={flashcardData} onClose={() => handleClose(null)} />
                    </div>
                ) : isLoading ? (
                    <div className="p-8 flex items-center justify-center h-full">Preparing a flashcard for you...</div>
                ) : (
                    <div className="p-8">Error loading flashcard data: {error?.message}</div>
                )}
            </div>
        </div>
    );
};

export default GenerateFlashcardModal;
