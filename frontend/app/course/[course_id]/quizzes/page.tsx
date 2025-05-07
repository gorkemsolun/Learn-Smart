"use client";

import { chatService } from "@/environment/backend_api";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { useLoading } from "@/hooks/useLoading";
import { LoadingSpinner } from "@/components/loading-spinner";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import QuizComponent from "@/components/course/quiz-component";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Trash2 } from "lucide-react";

export default function CourseQuizList() {
  const token = useAuthRedirect();
  const { loading, startLoading, stopLoading } = useLoading();
  const [selectedQuiz, setSelectedQuiz] = useState<string | null>(null);
  const [editingQuizId, setEditingQuizId] = useState<number | null>(null);
  const [newQuizTitle, setNewQuizTitle] = useState("");
  const [quizList, setQuizList] = useState<QuizJSON[]>([]);
  const [answeredQuestions, setAnsweredQuestions] = useState<Record<number, Set<number>>>({});
  const [quizResults, setQuizResults] = useState<Record<number, {correct: number, total: number}>>({});
  const params = useParams<{ course_id: string }>();
  const course_id = params.course_id;

  const handleQuizClick = (quizId: string) => {
    setSelectedQuiz(selectedQuiz === quizId ? null : quizId);
  };

  interface Quiz {
    chat_id: number;
    chat_title: string;
    quizzes: QuizItem[];
  }

  interface QuizItem {
    quiz_id: number;
    chat_id: number;
    course_id: number;
    created_at: string;
    num_questions: number;
    quiz_fid: number;
    quiz_title: string;
    completed: boolean;
    success_rate: number;
  }

  interface QuizJSON {
    quiz_id: number;
    chat_title: string;
    quiz_title: string;
    questions: QuizQuestion[];
    completed?: boolean;
    success_rate?: number;
    locked?: boolean;
  }

  interface QuizQuestion {
    question: string;
    choices: { [key: string]: string };
    answer: string;
  }

  // Track when a question is answered
  const handleQuestionAnswered = (quizId: number, questionIndex: number, isCorrect: boolean) => {
    setAnsweredQuestions(prev => {
      const updatedQuiz = new Set(prev[quizId] || []);
      updatedQuiz.add(questionIndex);

      return {
        ...prev,
        [quizId]: updatedQuiz
      };
    });

    setQuizResults(prev => {
      const quizResult = prev[quizId] || { correct: 0, total: 0 };
      return {
        ...prev,
        [quizId]: {
          correct: quizResult.correct + (isCorrect ? 1 : 0),
          total: quizResult.total + 1
        }
      };
    });
  };

  // Handle quiz completion (called when the submit quiz button is clicked)
  const handleQuizCompleted = async (quizId: number) => {
    // Check if all questions have been answered
    const quiz = quizList.find(q => q.quiz_id === quizId);
    const totalQuestions = quiz?.questions?.length || 0;
    const answered = getAnsweredCount(quizId);

    if (answered < totalQuestions) {
      alert(`Please answer all ${totalQuestions} questions before submitting.`);
      return;
    }

    const result = quizResults[quizId];
    // Calculate success rate based on correct answers divided by total questions
    const success_rate = result ? (result.correct / totalQuestions) * 100 : 0;

    try {
      startLoading();
      // Make API call to submit quiz results
      const response = await chatService.put(
        `/quiz/${quizId}/complete`,
        { success_rate },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Update quiz with completed status and success rate from response
      const updatedQuizData = response.data;

      setQuizList(prevList =>
        prevList.map(quiz =>
          quiz.quiz_id === quizId
            ? {
                ...quiz,
                completed: updatedQuizData.completed,
                success_rate: updatedQuizData.success_rate,
                locked: true // Lock the quiz when completed
              }
            : quiz
        )
      );

      // Reset progress tracking for this quiz
      setAnsweredQuestions(prev => {
        const newAnswered = { ...prev };
        delete newAnswered[quizId];
        return newAnswered;
      });

      setQuizResults(prev => {
        const newResults = { ...prev };
        delete newResults[quizId];
        return newResults;
      });

      console.log("Quiz completed and submitted successfully");
    } catch (error) {
      console.error("Error submitting quiz results:", error);
    } finally {
      stopLoading();
    }
  };

  // Get number of answered questions for a quiz
  const getAnsweredCount = (quizId: number): number => {
    return answeredQuestions[quizId]?.size || 0;
  };

  async function fetchQuizQuestions(quiz_id: number) {
    try {
      const response = await chatService.get(`/quiz/${quiz_id}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching quiz questions:", error);
      return [];
    }
  }

  async function processQuizList(data: Quiz[]) {
    const newQuizList: QuizJSON[] = [];
    for (const item of data) {
      for (const quiz of item.quizzes) {
        const questions = await fetchQuizQuestions(quiz.quiz_id);
        newQuizList.push({
          quiz_id: quiz.quiz_id,
          chat_title: item.chat_title,
          quiz_title: quiz.quiz_title,
          questions: questions,
          completed: quiz.completed,
          success_rate: quiz.success_rate,
          locked: quiz.completed // Lock the quiz if it's already completed
        });
      }
    }
    setQuizList(newQuizList);
  }

  useEffect(() => {
    if (token) {
      fetchQuizList(course_id);
    }
  }, [token, course_id]);

  const fetchQuizList = async (course_id: string) => {
    try {
      startLoading();
      const response = await chatService.get(`/course/${course_id}/quizzes`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data: Quiz[] = response.data.map((item: any) => ({
        chat_id: item.chat_id,
        chat_title: item.chat_title,
        quizzes: item.quizzes.map((quiz: any) => ({
          quiz_id: quiz.quiz_id,
          chat_id: quiz.chat_id,
          course_id: quiz.course_id,
          created_at: quiz.created_at,
          num_questions: quiz.num_questions,
          quiz_fid: quiz.quiz_fid,
          quiz_title: quiz.quiz_title,
          completed: quiz.completed,
          success_rate: quiz.success_rate,
        })),
      }));

      await processQuizList(data);
    } catch (error) {
      console.error("Error fetching quiz list:", error);
    } finally {
      stopLoading();
    }
  };

  const handleRenameQuiz = async (quizId: number) => {
    try {
      startLoading();
      await chatService.put(
        `/quiz/${quizId}`,
        { quiz_title: newQuizTitle },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setQuizList(quizList.map(quiz =>
        quiz.quiz_id === quizId ? { ...quiz, quiz_title: newQuizTitle } : quiz
      ));
      setEditingQuizId(null);
      setNewQuizTitle("");
    } catch (error) {
      console.error("Error renaming quiz:", error);
    } finally {
      stopLoading();
    }
  };

  const handleDeleteQuiz = async (quizId: number) => {
    if (!confirm("Are you sure you want to delete this quiz?")) return;

    try {
      startLoading();
      await chatService.delete(`/quiz/${quizId}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      setQuizList(quizList.filter(quiz => quiz.quiz_id !== quizId));
    } catch (error) {
      console.error("Error deleting quiz:", error);
    } finally {
      stopLoading();
    }
  };

  const startEditing = (quiz: QuizJSON) => {
    setEditingQuizId(quiz.quiz_id);
    setNewQuizTitle(quiz.quiz_title);
  };

  if (loading) return <LoadingSpinner />;

  if (!quizList || quizList.length === 0) {
    return (
      <Card className="text-center">
        <CardHeader>
          <h2 className="text-xl font-semibold">No Quizzes Available</h2>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            It looks like there are no quizzes to display at the moment.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="p-4">
      <h1 className="mb-4 text-2xl font-bold">Quizzes</h1>
      <ul>
        {quizList.map((quiz) => (
          <li key={quiz.quiz_id} className="mb-4">
            <div className="overflow-hidden rounded-lg border transition-shadow duration-300 hover:shadow-lg">
              <div
                className="flex cursor-pointer items-center justify-between p-4"
                onClick={() => handleQuizClick(quiz.quiz_id.toString())}
              >
                <div className="flex-1">
                  {editingQuizId === quiz.quiz_id ? (
                    <div className="flex gap-2">
                      <Input
                        value={newQuizTitle}
                        onChange={(e) => setNewQuizTitle(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRenameQuiz(quiz.quiz_id);
                        }}
                      >
                        Save
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingQuizId(null);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4">
                      <h2 className="font-semibold">{quiz.quiz_title}</h2>
                      <span className="text-sm text-gray-500">
                        ({quiz.chat_title})
                      </span>

                      {quiz.completed ? (
                        <div className="ml-4 flex items-center gap-2">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            quiz.success_rate >= 70 ? 'bg-green-100 text-green-800' : 
                            quiz.success_rate >= 50 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {`${Math.round(quiz.success_rate ?? 0)}% correct`}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            className="ml-2 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Reset the quiz tracking state completely
                              setAnsweredQuestions(prev => ({
                                ...prev,
                                [quiz.quiz_id]: new Set()
                              }));
                              setQuizResults(prev => ({
                                ...prev,
                                [quiz.quiz_id]: { correct: 0, total: 0 }
                              }));
                              // Unlock the quiz for retaking
                              setQuizList(prevList =>
                                prevList.map(q =>
                                  q.quiz_id === quiz.quiz_id
                                    ? { ...q, locked: false }
                                    : q
                                )
                              );
                              setSelectedQuiz(quiz.quiz_id.toString());
                            }}
                          >
                            Retake
                          </Button>
                        </div>
                      ) : (
                        quiz.questions && quiz.questions.length > 0 && (
                          <div className="ml-4 flex items-center gap-2">
                            <Progress
                              value={(getAnsweredCount(quiz.quiz_id) / quiz.questions.length) * 100}
                              className="h-2 w-24"
                            />
                            <span className="text-xs text-gray-500">
                              {getAnsweredCount(quiz.quiz_id)}/{quiz.questions.length}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
                <div className="ml-4 flex gap-2">
                  {editingQuizId !== quiz.quiz_id && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          startEditing(quiz);
                        }}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-red-500 hover:text-red-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteQuiz(quiz.quiz_id);
                        }}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
              <AnimatePresence>
                {selectedQuiz === quiz.quiz_id.toString() && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="border-t p-6">
                      {/* Add quiz-level progress bar here */}
                      {quiz.questions.length > 0 && !quiz.completed && (
                        <div className="mb-6">
                          <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                            <span>Quiz Progress</span>
                            <span>
                              {getAnsweredCount(quiz.quiz_id)}/{quiz.questions.length} questions answered
                            </span>
                          </div>
                          <Progress
                            value={(getAnsweredCount(quiz.quiz_id) / quiz.questions.length) * 100}
                            className="h-2"
                          />
                        </div>
                      )}

                      {quiz.questions.map((question, qIndex) => (
                        <QuizComponent
                          key={qIndex}
                          question={question.question}
                          options={question.choices}
                          answer={question.answer}
                          totalQuestions={quiz.questions.length}
                          currentQuestionIndex={qIndex}
                          isLastQuestion={false} // Set to false for all questions to prevent auto-completion
                          isLocked={quiz.locked === true}
                          onAnswered={(isCorrect) => handleQuestionAnswered(quiz.quiz_id, qIndex, isCorrect)}
                          onQuizCompleted={undefined} // Remove auto completion
                        />
                      ))}

                      {!quiz.locked && quiz.questions.length > 0 && (
                        <div className="mt-12 flex flex-col items-center space-y-4 border-t pt-8">
                          <Button
                            size="lg"
                            className="px-8 py-6 text-lg font-medium transition-all duration-200 hover:scale-105"
                            disabled={getAnsweredCount(quiz.quiz_id) < quiz.questions.length}
                            onClick={() => handleQuizCompleted(quiz.quiz_id)}
                          >
                            {getAnsweredCount(quiz.quiz_id) < quiz.questions.length ? "Submit Quiz" : "Submit Your Answers"}
                          </Button>

                          <div
                            className={`max-w-md text-center ${
                              getAnsweredCount(quiz.quiz_id) < quiz.questions.length
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-emerald-600 dark:text-emerald-400"
                            }`}
                          >
                            {getAnsweredCount(quiz.quiz_id) < quiz.questions.length ? (
                              <div className="flex flex-col items-center space-y-1">
                                <p className="text-sm font-medium">
                                  Please answer all {quiz.questions.length} questions before submitting
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {getAnsweredCount(quiz.quiz_id)}/{quiz.questions.length} questions answered
                                </p>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-2">
                                <p className="text-sm font-medium">
                                  You&#39;ve answered all questions! Save your result.
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}