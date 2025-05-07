import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { Check, X } from "lucide-react";

type QuizComponentProps = {
  question: string;
  options: { [key: string]: string };
  answer: string;
  onAnswered?: (isCorrect: boolean) => void;
  totalQuestions?: number;
  currentQuestionIndex?: number;
  onQuizCompleted?: () => Promise<void>;
  isLastQuestion?: boolean;
  isLocked?: boolean;
};

export default function QuizComponent({ 
  question, 
  options, 
  answer, 
  onAnswered,
  totalQuestions = 1,
  currentQuestionIndex = 0,
  onQuizCompleted,
  isLastQuestion = false,
  isLocked = false
}: QuizComponentProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  // Track previous lock state to detect when quiz is being retaken
  const [prevIsLocked, setPrevIsLocked] = useState(isLocked);

  useEffect(() => {
    // Update progress percentage when questions are answered
    if (totalQuestions > 0) {
      setProgressPercentage((questionsAnswered / totalQuestions) * 100);
    }
  }, [questionsAnswered, totalQuestions]);

  // If quiz is locked (completed), all questions should be submitted
  useEffect(() => {
    if (isLocked && !isSubmitted) {
      setIsSubmitted(true);
      // Note: We don't automatically show feedback when a quiz is locked
      // The user needs to actively interact to see feedback
    }
  }, [isLocked]);
  
  // Reset component state when quiz is being retaken (unlocked)
  useEffect(() => {
    // If the quiz was locked before but is now unlocked, it's being retaken
    if (prevIsLocked && !isLocked) {
      setSelectedOption(null);
      setIsSubmitted(false);
      setQuestionsAnswered(0);
      setIsCorrect(false);
      setShowFeedback(false);
    }
    // Update the previous lock state
    setPrevIsLocked(isLocked);
  }, [isLocked, prevIsLocked]);
  
  const handleOptionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (isLocked) return; // Don't allow changes if locked
    setSelectedOption(event.target.value);
  };

  const handleSubmit = async () => {
    if (!selectedOption) return;
    
    setIsSubmitted(true);
    setQuestionsAnswered(prev => prev + 1);
    setShowFeedback(true);

    const correct = selectedOption === answer;
    setIsCorrect(correct);
    
    // Notify parent component that this question was answered
    if (onAnswered) {
      onAnswered(correct);
    }
    
    // If this is the last question, make the API call
    if (isLastQuestion && onQuizCompleted) {
      try {
        await onQuizCompleted();
      } catch (error) {
        console.error("Error submitting quiz results:", error);
      }
    }
  };

  return (
    <Card className="p-6 shadow-md rounded-lg mb-6">
      <CardContent>
        {/* Progress bar showing quiz progress */}
        {totalQuestions > 1 && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Progress</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        )}
        
        <h3 className="text-xl font-semibold mb-4">{question}</h3>
        {Object.entries(options).map(([key, value]) => (
          <div key={key} className="mb-2">
            <label className={`flex items-center space-x-2 p-2 rounded-md ${
              (showFeedback || isLocked) && key === answer 
                ? 'bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800' 
                : showFeedback && selectedOption === key && selectedOption !== answer 
                  ? 'bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800' 
                  : ''
            }`}>
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  value={key}
                  checked={selectedOption === key}
                  onChange={handleOptionChange}
                  disabled={isSubmitted || isLocked}
                  className="form-radio"
                />
                <span>{value}</span>
              </div>
              
              {/* Always show the correct answer indicator for locked quizzes */}
              {(isLocked || showFeedback) && key === answer && (
                <span className="ml-auto inline-flex items-center text-green-600 dark:text-green-400">
                  <Check size={16} className="mr-1" /> Correct Answer
                </span>
              )}
              {/* Only show incorrect indicators if user has submitted an answer */}
              {showFeedback && selectedOption === key && selectedOption !== answer && (
                <span className="ml-auto inline-flex items-center text-red-600 dark:text-red-400">
                  <X size={16} className="mr-1" /> Incorrect
                </span>
              )}
            </label>
          </div>
        ))}
        
        {!isSubmitted && !isLocked && (
          <Button onClick={handleSubmit} className="mt-4" disabled={!selectedOption}>
            Submit
          </Button>
        )}
        
        {/* Only show the "Wrong!" feedback message if user submitted an answer */}
        {showFeedback && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`mt-4 text-lg ${isCorrect ? 'text-green-600' : 'text-red-600'}`}
          >
            {isCorrect ? "Correct!" : `Wrong! The correct answer is ${answer}.`}
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
