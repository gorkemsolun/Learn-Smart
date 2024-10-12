"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type FlashCardProps = {
  question: string;
  answer: string;
};

export default function FlashCard({
  question,
  answer,
}: FlashCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleCardFlip = () => {
    setIsFlipped(!isFlipped);
  };

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div
        className="w-[400px] h-[600px] [perspective:1000px] cursor-pointer" 
        onClick={handleCardFlip}
      >
        {/* Card Flipping Logic */}
        <div
          className={`relative w-full h-full transition-all duration-500 [transform-style:preserve-3d] ${
            isFlipped ? "[transform:rotateY(180deg)]" : ""
          }`}
        >
          {/* Front of the Card (Question) */}
          <Card className="absolute w-full h-full [backface-visibility:hidden] flex flex-col">
            <CardHeader className="flex-shrink-0 p-4">
              <CardTitle className="text-xl">Question</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow overflow-auto p-4">
              <p className="text-xl break-words">{question}</p>
            </CardContent>
          </Card>

          {/* Back of the Card (Answer) */}
          <Card className="absolute w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] flex flex-col">
            <CardHeader className="flex-shrink-0 p-4">
              <CardTitle className="text-xl">Answer</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow overflow-auto p-4">
              <p className="text-xl break-words">{answer}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
