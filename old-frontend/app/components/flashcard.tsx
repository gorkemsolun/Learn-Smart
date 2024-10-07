"use client";

import { useEffect, useState } from "react";
import ReactCardFlip from "react-card-flip";

type FlashCardProps = {
  question: string;
  answer: string;
  isTransitioning: boolean;
};

export default function FlashCard({
  question,
  answer,
  isTransitioning,
}: FlashCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleCardFlip = () => {
    setIsFlipped(!isFlipped);
  };

  useEffect(() => {
    if (isTransitioning) {
      setIsFlipped(false);
    }
  }, [isTransitioning]);

  return (
    <div className="flex justify-center items-center min-h-screen">
      <ReactCardFlip isFlipped={isFlipped} flipDirection="horizontal">
        {/* Adjust flipDirection later. Horizontal seems good for now but vertical is also a good choice*/}
        <div
          className={`overflow-auto bg-white shadow-md rounded-lg flex flex-col justify-start items-center p-6 transition-opacity duration-300 cursor-pointer hover:shadow-2xl ${
            isTransitioning ? "opacity-0" : "opacity-100"
          }`}
          style={{ width: "400px", height: "600px" }}
          onClick={handleCardFlip}
        >
          <h2 className="text-center mb-4 text-2xl font-bold">Question</h2>
          <hr className="w-full border-t-2 border-gray-300 mb-4" />
          <div className="flex-grow flex flex-col justify-center items-center">
            <p className="text-center mb-4 whitespace-normal">{question}</p>
          </div>
        </div>

        <div
          className={`overflow-auto bg-white shadow-md rounded-lg flex flex-col justify-start items-center p-6 transition-opacity duration-300 cursor-pointer hover:shadow-2xl ${
            isTransitioning ? "opacity-0" : "opacity-100"
          }`}
          style={{ width: "400px", height: "600px" }}
          onClick={handleCardFlip}
        >
          <h2 className="text-center mb-4 text-2xl font-bold">Answer</h2>
          <hr className="w-full border-t-2 border-gray-300 mb-4" />
          <div className="flex-grow flex flex-col justify-center items-center">
            <p className="text-center mb-4 whitespace-normal">{answer}</p>
          </div>
        </div>
      </ReactCardFlip>
    </div>
  );
}
