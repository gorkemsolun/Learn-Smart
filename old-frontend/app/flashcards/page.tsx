"use client";

import { useEffect, useState } from "react";
import { Flashcard } from "../types";
import "../style/bg-animation.css";
import FlashCard from "../components/flashcard";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"


export default function FlashcardsPage({ flashcardData, onClose }) {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (flashcardData?.flashcards && flashcardData?.explanations) {
      const combinedFlashcards = flashcardData.flashcards.map(
        (topic: string, index: number) => ({
          flashcard_topic: topic,
          flashcard_explanation: flashcardData.explanations[index] || "", // Provide a fallback in case explanations are missing
        })
      );
      setFlashcards(combinedFlashcards);
      console.log("set flaschards data");
      setLoading(false);
    } else {
      console.error("Invalid data structure:", flashcardData);
      setLoading(false);
    }
  }, [flashcardData]);  // Run the effect whenever flashcardData changes
 


  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center w-full flex-1 px-20 text-center bg-black">
     
      {flashcards.length > 0 ? (
        <div className="w-full h-full overflow-y-auto">
          <Carousel>
            <CarouselContent>
              {flashcards.map((flashcard, index) => (
                <CarouselItem key={index}>
                  <FlashCard
                    question={flashcard.flashcard_topic}
                    answer={flashcard.flashcard_explanation}
                  />
                </CarouselItem>
              ))}
            </CarouselContent>

            <CarouselPrevious className="w-8 h-8 p-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-full absolute left-2 top-1/2 transform -translate-y-1/2"/>
            <CarouselNext className="w-8 h-8 p-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-full absolute right-2 top-1/2 transform -translate-y-1/2" />
          </Carousel>
        </div>
      ) : (
        <p>No flashcards available.</p>
      )}
    </div>
  );
}
