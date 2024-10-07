"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { Flashcard } from "../types";
import "../style/bg-animation.css";
import FlashCard from "../components/flashcard";

export default function FlashcardsPage() {
  const searchParams = useSearchParams();
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const data = searchParams.get("data");
    if (data) {
      try {
        const parsedData = JSON.parse(decodeURIComponent(data));
        if (parsedData.flashcards && parsedData.explanations) {
          const combinedFlashcards = parsedData.flashcards.map(
            (topic: string, index: number) => ({
              flashcard_topic: topic,
              flashcard_explanation: parsedData.explanations[index] || "", // Provide a fallback in case explanations are missing
            })
          );
          setFlashcards(combinedFlashcards);
          setLoading(false);
        } else {
          console.error("Invalid data structure:", parsedData);
        }
      } catch (error) {
        console.error("Error parsing data:", error);
      }
    }
  }, [searchParams]);

  const handleNextCard = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentCardIndex((currentCardIndex + 1) % flashcards.length);
      setIsTransitioning(false);
    }, 300);
  };

  const handlePreviousCard = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentCardIndex(
        (currentCardIndex - 1 + flashcards.length) % flashcards.length
      );
      setIsTransitioning(false);
    }, 300);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center w-full flex-1 px-20 text-center bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 min-h-screen animated-gradient">
      {flashcards.length > 0 ? (
        <div className="flex flex-col items-center w-full">
          <div className="flex justify-between w-full items-center mb-4">
            <button
              onClick={handlePreviousCard}
              className="bg-white rounded-full p-2 text-blue-500 hover:bg-gray-200 focus:outline-none"
            >
              <FaArrowLeft size={36} />
            </button>
            <FlashCard
              question={flashcards[currentCardIndex].flashcard_topic}
              answer={flashcards[currentCardIndex].flashcard_explanation}
              isTransitioning={isTransitioning}
            />
            <button
              onClick={handleNextCard}
              className="bg-white rounded-full p-2 text-blue-500 hover:bg-gray-200 focus:outline-none"
            >
              <FaArrowRight size={36} />
            </button>
          </div>
        </div>
      ) : (
        <p>No flashcards available.</p>
      )}
    </div>
  );
}
