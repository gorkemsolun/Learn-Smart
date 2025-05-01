"use client";

import { chatService } from "@/environment/backend_api";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { useLoading } from "@/hooks/useLoading";
import { LoadingSpinner } from "@/components/loading-spinner";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import QuizComponent from "@/components/quiz-component";
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
  const params = useParams<{ course_id: string }>();
  const course_id = params.course_id;

  const handleQuizClick = (question: string) => {
    setSelectedQuiz(selectedQuiz === question ? null : question);
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
  }

  interface QuizJSON {
    quiz_id: number;
    chat_title: string;
    quiz_title: string;
    questions: QuizQuestion[];
  }

  interface QuizQuestion {
    question: string;
    choices: { [key: string]: string };
    answer: string;
  }

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
        });
      }
    }
    setQuizList(newQuizList);
    console.log("Quiz List:", newQuizList);
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
      <h1 className="text-2xl font-bold mb-4">Quizzes</h1>
      <ul>
        {quizList.map((quiz) => (
          <li key={quiz.quiz_id} className="mb-4">
            <div className="border rounded-lg overflow-hidden transition-shadow duration-300 hover:shadow-lg">
              <div
                className="cursor-pointer p-4 flex justify-between items-center"
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
                    </div>
                  )}
                </div>
                <div className="flex gap-2 ml-4">
                  {editingQuizId !== quiz.quiz_id && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          startEditing(quiz);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteQuiz(quiz.quiz_id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
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
                    <div className="p-6 border-t">
                      {quiz.questions.map((question, qIndex) => (
                        <QuizComponent
                          key={qIndex}
                          question={question.question}
                          options={question.choices}
                          answer={question.answer}
                        />
                      ))}
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