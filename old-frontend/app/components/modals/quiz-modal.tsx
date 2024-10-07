import QuizMenu from "@/app/quiz/page";
import { backendAPI } from "@/environment/backend_api";
import { useEffect, useState } from "react";
import { QuizModalParameters } from "../../types";

const QuizModal = (modalParameters: QuizModalParameters) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); // Ensure error state is a string or null
  const [quizData, setQuizData] = useState(null);

  const handleClose = () => {
    setQuizData(null);
    setError(null); // Reset error state on close
    modalParameters.onClose(); // Trigger the parent close function
  };

  const fetchQuiz = async (quizName: string) => {
    await backendAPI
      .get(`/course/${modalParameters.courseID}/quizzes/${quizName}`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${modalParameters.token}`,
          "Content-Type": "application/json",
        },
      })
      .then((response) => {
        setQuizData(response.data);
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
      fetchQuiz(modalParameters.quizName);
    }
  }, [modalParameters.isOpen]);

  if (!modalParameters.isOpen) return null; // Prevent rendering if modal is not open

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-3xl rounded-lg shadow-lg overflow-hidden max-h-[90vh] relative">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
          aria-label="Close"
        >
          &#10005; {/* This is the Unicode character for an "X" symbol */}
        </button>

        {quizData ? (
          <div className="overflow-y-auto max-h-full">
            <QuizMenu quizData={quizData} onClose={handleClose} />
          </div>
        ) : isLoading ? (
          <div className="p-8 flex items-center justify-center h-full">
            Loading...
          </div>
        ) : error ? (
          <div className="p-8">Error loading quiz data: {error}</div>
        ) : null}
      </div>
    </div>
  );
};

export default QuizModal;
