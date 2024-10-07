"use client";

import { useState } from "react";
import { QuizParameters } from "../types";

export default function Quiz({
  question,
  choices,
  answer,
  currentQuestionIndex,
  totalQuestions,
  onNextQuestion,
}: QuizParameters) {
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);

  const handleChoiceClick = (choice: string) => {
    setSelectedChoice(choice);
    setIsAnswered(true);
  };

  const checkAnswer = () => {
    // Compare only the first character (label) of the selectedChoice with the answer
    return selectedChoice?.charAt(0).toUpperCase() === answer.toUpperCase();
  };

  const resetQuiz = () => {
    setSelectedChoice(null);
    setIsAnswered(false);
  };

  const handleNextQuestion = () => {
    onNextQuestion(checkAnswer());
    resetQuiz();
  };

  return (
    <div className="p-4 border rounded shadow-md">
      <p className="text-lg font-medium mb-2">
        Question {currentQuestionIndex + 1} of {totalQuestions}
      </p>
      <p className="text-lg font-medium mb-2">Question: {question}</p>
      <div className="space-y-2">
        {choices.map((choice, index) => (
          <button
            key={index}
            type="button"
            onClick={() => handleChoiceClick(choice)}
            className={`w-full px-4 py-2 rounded ${
              isAnswered && selectedChoice === choice
                ? checkAnswer()
                  ? "bg-green-500 text-white"
                  : "bg-red-500 text-white"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            {choice}
          </button>
        ))}
      </div>
      <div className="flex justify-center mt-4">
        <button
          onClick={handleNextQuestion}
          disabled={!isAnswered}
          type="button"
          className={`px-4 py-2 rounded ${
            isAnswered
              ? "bg-blue-500 text-white hover:bg-blue-600"
              : "bg-gray-200 text-gray-500 cursor-not-allowed"
          }`}
        >
          Next Question
        </button>
      </div>
    </div>
  );
}
