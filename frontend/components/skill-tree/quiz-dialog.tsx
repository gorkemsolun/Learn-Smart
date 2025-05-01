"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, AlertCircle, ArrowLeft, ArrowRight, Clock } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function QuizModal({
  node,
  open,
  onClose,
  onQuizComplete,
}: {
  node: {
    id: number | string;
    name: string;
    state?: string;
    quiz: Array<{
      question: string;
      type: string;
      options: Record<string, string>;
      answer: string;
    }>;
  };
  open: boolean;
  onClose: () => void;
  onQuizComplete: (nodeId: number | string, passed: boolean, score: number) => void;
}) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [timer, setTimer] = useState(0);
  const [hasQuestions, setHasQuestions] = useState(false);

  // Check if the quiz has valid questions
  useEffect(() => {
    if (node && node.quiz && Array.isArray(node.quiz) && node.quiz.length > 0) {
      setHasQuestions(true);
    } else {
      setHasQuestions(false);
    }
  }, [node]);

  // Reset state when modal closes or changes to results view
  useEffect(() => {
    if (!open) {
      setCurrentQuestionIndex(0);
      setSelectedAnswers({});
      setShowResults(false);
      setTimer(0);
    }
  }, [open]);

  // Handle timer
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;

    if (open && !showResults) {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [open, showResults]);

  const handleAnswerSelect = useCallback((answer: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestionIndex]: answer,
    }));
  }, [currentQuestionIndex]);

  const handleNext = useCallback(() => {
    if (currentQuestionIndex < node.quiz.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      setShowResults(true);
    }
  }, [currentQuestionIndex, node.quiz.length]);

  const handlePrevious = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  }, [currentQuestionIndex]);

  const calculateScore = useCallback(() => {
    const total = node.quiz.length;
    let correct = 0;

    node.quiz.forEach((question, index) => {
      if (selectedAnswers[index] === question.answer) {
        correct++;
      }
    });

    const percentage = Math.round((correct / total) * 100);
    return { correct, total, percentage };
  }, [node.quiz, selectedAnswers]);

  const handleFinish = useCallback(() => {
    const { percentage } = calculateScore();
    const passed = percentage >= 70; // Consider 70% as passing score

    // Pass the actual node.id type (string or number) to the callback
    onQuizComplete(node.id, passed, percentage);
    onClose();
  }, [calculateScore, node.id, onClose, onQuizComplete]);

  const formatTime = useCallback((seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  }, []);

  const resetQuiz = useCallback(() => {
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setShowResults(false);
    setTimer(0);
  }, []);

  const handleTryAgain = useCallback(() => {
    resetQuiz();
  }, [resetQuiz]);

  if (!open) {
    return null;
  }

  if (!hasQuestions) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="border border-border bg-background text-foreground shadow-md sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl font-semibold tracking-tight">No Quiz Available</DialogTitle>
          </DialogHeader>
          <div className="py-8 text-center">
            <AlertCircle className="mx-auto mb-4 size-16 text-amber-500" strokeWidth={1.5} />
            <p className="text-lg text-foreground/70">
              There are no quiz questions available for this node yet.
            </p>
          </div>
          <DialogFooter>
            <Button
              onClick={onClose}
              className="rounded-full bg-primary px-6 py-2 font-medium text-primary-foreground shadow-sm transition-all duration-200 hover:bg-primary/90 hover:shadow"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  const currentQuestion = node.quiz[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / node.quiz.length) * 100;
  const isReviewMode = node.state === "completed";
  const { correct, total, percentage } = calculateScore();
  const passed = percentage >= 70;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="border border-border bg-background text-foreground shadow-md sm:max-w-md md:max-w-lg">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-center text-2xl font-semibold tracking-tight">
            {showResults ? "Quiz Results" : node.name}
          </DialogTitle>
          {!showResults && (
            <div className="flex items-center justify-between text-sm text-foreground/60">
              <span className="font-medium">
                Question {currentQuestionIndex + 1} of {node.quiz.length}
              </span>
              <div className="flex items-center gap-1.5">
                <Clock className="size-4" />
                <span>{formatTime(timer)}</span>
              </div>
            </div>
          )}
        </DialogHeader>

        {!showResults ? (
          <>
            <div className="mb-2 space-y-1.5">
              <div className="flex justify-between text-xs text-foreground/60">
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2 bg-muted" indicatorClassName="bg-primary" />
            </div>

            <div className="space-y-6 py-2">
              <div className="rounded-lg border border-border bg-card p-4 text-lg font-medium shadow-sm">
                {currentQuestion.question}
              </div>

              <RadioGroup
                value={selectedAnswers[currentQuestionIndex] || ""}
                onValueChange={handleAnswerSelect}
                className="space-y-3"
              >
                {Object.entries(currentQuestion.options).map(([key, value]) => {
                  const isCorrectAnswer = key === currentQuestion.answer;
                  const isSelected = key === selectedAnswers[currentQuestionIndex];

                  return (
                    <div
                      key={key}
                      className={cn(
                        "flex items-center space-x-2 rounded-lg border border-border p-4 transition-all duration-200",
                        "hover:border-primary/50 hover:bg-accent",
                        "cursor-pointer shadow-sm",
                        isSelected && !isReviewMode && "border-primary bg-accent",
                        isReviewMode &&
                          isCorrectAnswer &&
                          "border-emerald-500/50 bg-emerald-50/50 dark:border-emerald-700/50 dark:bg-emerald-900/10",
                      )}
                      onClick={() => handleAnswerSelect(key)}
                    >
                      <RadioGroupItem
                        value={key}
                        id={`option-${key}`}
                        className={cn(
                          isSelected && "text-primary",
                          isReviewMode && isCorrectAnswer && "text-emerald-600 dark:text-emerald-400",
                        )}
                      />
                      <Label htmlFor={`option-${key}`} className="flex-1 cursor-pointer">
                        <span className="font-medium">{key}:</span> {value}
                        {isReviewMode && isCorrectAnswer && (
                          <span className="ml-2 text-sm font-medium text-emerald-500">(Correct Answer)</span>
                        )}
                      </Label>
                    </div>
                  );
                })}
              </RadioGroup>
            </div>

            <DialogFooter className="flex justify-between gap-2 pt-2 sm:justify-between">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
                className="rounded-full border-border px-5 font-medium text-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <ArrowLeft className="mr-2 size-4" /> Previous
              </Button>
              <Button
                onClick={handleNext}
                disabled={!selectedAnswers[currentQuestionIndex]}
                className={cn(
                  "rounded-full px-6 font-medium text-primary-foreground shadow-sm transition-all duration-200 hover:shadow",
                  "bg-primary hover:bg-primary/90",
                  !selectedAnswers[currentQuestionIndex] && "cursor-not-allowed opacity-50",
                )}
              >
                {currentQuestionIndex === node.quiz.length - 1 ? "Finish" : "Next"}{" "}
                <ArrowRight className="ml-2 size-4" />
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="space-y-6 py-4">
              <div className="flex flex-col items-center space-y-6 py-4">
                <div
                  className={cn(
                    "flex size-24 items-center justify-center rounded-full shadow-md",
                    passed ? "bg-emerald-100 dark:bg-emerald-900/20" : "bg-destructive/10",
                  )}
                >
                  {passed ? (
                    <CheckCircle2 className="size-12 text-emerald-500 dark:text-emerald-400" strokeWidth={2} />
                  ) : (
                    <XCircle className="size-12 text-destructive" strokeWidth={2} />
                  )}
                </div>

                <div className="space-y-1 text-center">
                  <h3 className="text-2xl font-bold">{passed ? "Congratulations!" : "Try Again"}</h3>
                  <p className="text-foreground/60">
                    {passed
                      ? "You've successfully completed this quiz."
                      : "You need to score at least 70% to pass."}
                  </p>
                </div>

                <div className="flex w-full flex-col gap-3 rounded-lg border border-border bg-card p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-foreground/60">Time taken:</span>
                    <span className="font-medium">{formatTime(timer)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-foreground/60">Score:</span>
                    <span className="text-lg font-bold">{percentage}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-foreground/60">Correct Answers:</span>
                    <span className="font-medium">
                      {correct} of {total}
                    </span>
                  </div>
                  <div className="my-1 h-px w-full bg-foreground/20"></div>
                  <div className="flex items-center justify-between">
                    <span className="text-foreground/60">Status:</span>
                    <span
                      className={cn(
                        "rounded-full px-3 py-1 text-sm font-bold",
                        passed
                          ? "bg-emerald-100/50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
                          : "bg-destructive/10 text-destructive",
                      )}
                    >
                      {passed ? "Passed" : "Failed"}
                    </span>
                  </div>
                </div>

                {!passed && (
                  <div className="flex items-start gap-3 rounded-lg border border-amber-200/50 bg-amber-100/50 p-4 dark:border-amber-800/30 dark:bg-amber-900/10">
                    <AlertCircle className="mt-0.5 size-5 text-amber-500" strokeWidth={2} />
                    <div className="text-sm text-amber-700 dark:text-amber-400">
                      Review the material and try again. You need to score at least 70% to pass this quiz.
                    </div>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="flex justify-end gap-2 pt-2 sm:justify-end">
              {!passed && (
                <Button
                  variant="outline"
                  onClick={handleTryAgain}
                  className="rounded-full border-border px-5 font-medium text-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  Try Again
                </Button>
              )}
              <Button
                onClick={handleFinish}
                className="rounded-full bg-primary px-8 py-2.5 font-medium text-primary-foreground shadow-sm transition-all duration-200 hover:bg-primary/90 hover:shadow"
              >
                {passed ? "Complete" : "Close"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
