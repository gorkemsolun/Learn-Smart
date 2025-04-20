"use client";

import { LoadingSpinner } from "@/components/LoadingSpinner";
import Quiz from "@/components/quiz";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { backendAPI } from "@/environment/backend_api";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { useLoading } from "@/hooks/useLoading";
import { AnimatePresence, motion } from "framer-motion";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type QuizItem = {
  question: string;
  options: Record<string, string>;
  answer: string;
};

// ——— Default dummy data ———
const DEFAULT_QUIZ_DATA: { [filename: string]: QuizItem[] } = {
  "js_basics_quiz.json": [
    {
      question: "Which keyword declares a constant in JS?",
      options: { A: "let", B: "const", C: "var", D: "static" },
      answer: "B",
    },
    {
      question: "What’s the output of `typeof null`?",
      options: { A: "null", B: "object", C: "undefined", D: "number" },
      answer: "B",
    },
  ],
  "dom_quiz.json": [
    {
      question: "Which method selects a single element by CSS selector?",
      options: {
        A: "getElementById",
        B: "querySelector",
        C: "getElementsByClassName",
        D: "getElementsByTagName",
      },
      answer: "B",
    },
  ],
  "react_intro_quiz.json": [
    {
      question: "What hook lets you add React state to a function component?",
      options: {
        A: "useState",
        B: "useEffect",
        C: "useContext",
        D: "useReducer",
      },
      answer: "A",
    },
    {
      question: "JSX must be wrapped in a single _____.",
      options: { A: "element", B: "function", C: "string", D: "comment" },
      answer: "A",
    },
  ],
};

export default function CourseQuizList() {
  const token = useAuthRedirect();
  const { loading, startLoading, stopLoading } = useLoading();
  const [selectedQuiz, setSelectedQuiz] = useState<string | null>(null);
  const [quizData, setQuizData] = useState<{ [filename: string]: QuizItem[] }>(
    DEFAULT_QUIZ_DATA
  );
  const params = useParams<{ course_id: string }>();
  const course_id = params.course_id;

  const handleQuizClick = (filename: string) => {
    setSelectedQuiz(selectedQuiz === filename ? null : filename);
  };

  useEffect(() => {
    if (token) {
      fetchQuizList(course_id);
    }
  }, [token, course_id]);

  const fetchQuizList = async (course_id: string) => {
    try {
      startLoading();
      const listResponse = await backendAPI.get(
        `/course/${course_id}/quizzes`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const quizzesData: { [filename: string]: QuizItem[] } = {};

      for (const item of listResponse.data) {
        for (const filename of item.quizzes as string[]) {
          const quizRes = await backendAPI.get(
            `/course/${course_id}/quizzes/${filename}`,
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            }
          );
          quizzesData[filename] = quizRes.data as QuizItem[];
        }
      }

      // TODO: change the following line to use the correct type for quizzesData
      // merge fetched with defaults (fetched takes precedence)
      setQuizData({
        ...DEFAULT_QUIZ_DATA,
        ...quizzesData,
      });
    } catch (error) {
      console.error(
        "Error fetching quiz data, falling back to defaults:",
        error
      );
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
          <p className="text-muted-foreground">
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
        {Object.entries(quizData).map(([filename, quizzes]) => (
          <li key={filename} className="mb-4">
            <div
              className="cursor-pointer rounded-lg border p-2 hover:bg-gray-800"
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
                  <div className="rounded-lg border p-6 shadow-md">
                    {quizzes.map((quiz, qIndex) => (
                      <Quiz
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
