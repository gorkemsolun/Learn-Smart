"use client";

import { backendAPI } from "@/environment/backend_api";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { useLoading } from "@/hooks/useLoading";
import { LoadingSpinner } from "@/components/loading-spinner";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import QuizComponent from "@/components/quiz-component";
import { motion, AnimatePresence } from "framer-motion";

export default function CourseQuizList() {
  const token = useAuthRedirect();
  const { loading, startLoading, stopLoading } = useLoading();
  const [selectedQuiz, setSelectedQuiz] = useState<string | null>(null);
  const [quizData, setQuizData] = useState<{ [filename: string]: any[] }>({});
  const params = useParams<{ course_id: string }>();
  const course_id = params.course_id;

  const handleQuizClick = (question: string) => {
    setSelectedQuiz(selectedQuiz === question ? null : question);
  };

  useEffect(() => {
    if (token) {
      fetchQuizList(course_id);
    }
  }, [token, course_id]);

  const fetchQuizList = async (course_id: string) => {
    try {
      startLoading();
      const response = await backendAPI.get(`/course/${course_id}/quizzes`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const quizzesData: { [filename: string]: any[] } = {};

      for (const item of response.data) {
        const { chat_id, chat_title, quizzes } = item;
        for (const filename of quizzes) {
          const quizResponse = await backendAPI.get(`/course/${course_id}/quizzes/${filename}`, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });

          quizzesData[filename] = quizResponse.data;
        }
      }

      setQuizData(quizzesData);
    } catch (error) {
      console.error("Error fetching quiz data:", error);
    } finally {
      stopLoading();
    }
  };

  if (loading) return <LoadingSpinner />;

  if (!quizData || Object.keys(quizData).length === 0) {
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
        {Object.entries(quizData).map(([filename, quizzes]) => (
          <li key={filename} className="mb-4">
            <div
              className="cursor-pointer p-2 border rounded-lg hover:bg-gray-200"
              onClick={() => handleQuizClick(filename)}
            >
              <h2 className="font-semibold">{filename}</h2>
            </div>
            <AnimatePresence>
              {selectedQuiz === filename && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.5 }}
                  className="mt-2 overflow-hidden"
                >
                  <div className="p-6 border shadow-md rounded-lg">
                    {quizzes.map((quiz, qIndex) => (
                      <QuizComponent
                        key={qIndex}
                        question={quiz.question}
                        options={quiz.options}
                        answer={quiz.answer}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </li>
        ))}
      </ul>
    </div>
  );
}
