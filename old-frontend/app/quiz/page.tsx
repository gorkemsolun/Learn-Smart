"use client";

import { useState } from "react";
import Quiz from "../components/quiz";
import "../style/quiz.css";

export default function QuizMenu({ quizData, onClose }) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [quizEnded, setQuizEnded] = useState(false);

  const handleNextQuestion = (isCorrect: boolean) => {
    if (isCorrect) {
      setCorrectAnswers((prevCorrectAnswers) => prevCorrectAnswers + 1);
    }
    if (currentQuestionIndex + 1 < quizData.length) {
      setCurrentQuestionIndex((prevIndex) => prevIndex + 1);
    } else {
      setQuizEnded(true);
    }
  };

  const restartQuiz = () => {
    setCurrentQuestionIndex(0);
    setCorrectAnswers(0);
    setQuizEnded(false);
  };

  const getEmote = (score: number, total: number) => {
    const percentage = (score / total) * 100;
    if (percentage === 100) {
      return "🎉";
    } else if (percentage >= 80) {
      return "😊";
    } else if (percentage >= 50) {
      return "😐";
    } else {
      return "😢";
    }
  };

  const labeledChoices = quizData[currentQuestionIndex].choices.map(
    (choice: string, index: number) => {
      const labels = ["A", "B", "C", "D", "E"];
      return `${labels[index]}. ${choice}`;
    }
  );

  return (
    <div>
      <div className="flex flex-col items-center justify-center h-full">
        <div className="w-full max-w-3xl bg-white rounded-lg shadow-lg p-6 md:p-8">
          <h1 className="text-2xl md:text-4xl font-bold text-gray-800 mb-4 md:mb-6 text-center">
            Quiz
          </h1>
          <hr className="border-gray-300 mb-4 md:mb-8" />
          {quizEnded ? (
            <div className="flex flex-col items-center justify-center space-y-4">
              <p className="text-lg text-center">
                You scored {correctAnswers} out of {quizData.length}
                <span className="block text-2xl font-medium">
                  {getEmote(correctAnswers, quizData.length)}
                </span>
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={restartQuiz}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition duration-300"
                >
                  Restart Quiz
                </button>
                <button
                  onClick={() => onClose(null)}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition duration-300"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <Quiz
              question={quizData[currentQuestionIndex].question}
              choices={labeledChoices}
              answer={quizData[currentQuestionIndex].answer}
              currentQuestionIndex={currentQuestionIndex}
              totalQuestions={quizData.length}
              onNextQuestion={handleNextQuestion}
            />
          )}
        </div>
      </div>
    </div>
  );
  
}

