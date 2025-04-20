"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import React, { useState } from "react";

type QuizComponentProps = {
  question: string;
  options: { [key: string]: string };
  answer: string;
  onSubmit?: (isCorrect: boolean) => void;
};

export default function Quiz({
  question,
  options,
  answer,
  onSubmit,
}: QuizComponentProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleOptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedOption(e.target.value);
  };

  const handleSubmit = () => {
    setIsSubmitted(true);
    const correct = selectedOption === answer;
    onSubmit?.(correct);
  };

  const isCorrect = selectedOption === answer;

  return (
    <Card className="rounded-lg p-6 shadow-md">
      <CardContent>
        <h3 className="mb-4 text-xl font-semibold">{question}</h3>

        {Object.entries(options).map(([key, value]) => (
          <div key={key} className="mb-2">
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                value={key}
                checked={selectedOption === key}
                onChange={handleOptionChange}
                disabled={isSubmitted}
                className="form-radio"
              />
              <span>{value}</span>
            </label>
          </div>
        ))}

        {!isSubmitted ? (
          <Button onClick={handleSubmit} className="mt-4">
            Submit
          </Button>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 text-lg"
          >
            {isCorrect ? "Correct!" : `Wrong! The correct answer is ${answer}.`}
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
