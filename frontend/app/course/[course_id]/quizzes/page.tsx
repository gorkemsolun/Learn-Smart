"use client";

import { backendAPI } from "@/environment/backend_api";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { useLoading } from "@/hooks/useLoading";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import QuizComponent from "@/components/quiz-component";
import { motion, AnimatePresence } from "framer-motion";

export default function CourseQuizList() {
  const token = useAuthRedirect();
  const { loading, startLoading, stopLoading } = useLoading();
  const [selectedQuiz, setSelectedQuiz] = useState<string | null>(null);
  /*
  const [quizList, setQuizList] = useState<
    Array<{
      question: string;
      type: string;
      options: { [key: string]: string };
      answer: string;
    }>
  >([]); */
  const params = useParams<{ course_id: string }>();
  const course_id = params.course_id;

  // Dummy data for multiple quizzes
  const dummyQuizList = [
    {
      title: "Quiz 1: Storage Basics",
      questions: [
        {
          question: "What is the defining characteristic of mass storage?",
          type: "multiple-choice",
          options: {
            A: "It is always online and readily accessible.",
            B: "It is volatile and data is lost when the computer is turned off.",
            C: "It is persistent storage that retains data even when the computer is powered off.",
            D: "It is limited in capacity and suitable only for small amounts of data."
          },
          answer: "C"
        },
        {
          question: "Which of the following is NOT an example of secondary storage?",
          type: "multiple-choice",
          options: {
            A: "Hard Disk Drive (HDD)",
            B: "Solid State Drive (SSD)",
            C: "CD-ROM",
            D: "Flash-based SSD"
          },
          answer: "C"
        }
      ]
    },
    {
      title: "Quiz 2: Advanced Storage",
      questions: [
        {
          question: "What does RAID stand for?",
          type: "multiple-choice",
          options: {
            A: "Random Array of Independent Disks",
            B: "Redundant Array of Independent Disks",
            C: "Reliable Array of Interconnected Drives",
            D: "Redundant Access of Integrated Data"
          },
          answer: "B"
        },
        {
          question: "Which type of storage is typically used for backups and long-term archiving?",
          type: "multiple-choice",
          options: {
            A: "Primary storage",
            B: "Secondary storage",
            C: "Tertiary storage",
            D: "Volatile storage"
          },
          answer: "C"
        }
      ]
    }
  ];

  const [quizList, setQuizList] = useState(dummyQuizList);

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
      //setQuizList(dummyQuizList);
      console.log(response.data);
    } catch (error) {
      console.error("Error fetching quiz data:", error);
    } finally {
      stopLoading();
    }
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
        {quizList.map((quiz, index) => (
          <li key={index} className="mb-4">
            <div
              className="cursor-pointer p-2 border rounded-lg hover:bg-gray-200"
              onClick={() => handleQuizClick(quiz.title)}
            >
              <h2 className="font-semibold">{quiz.title}</h2>
            </div>
            <AnimatePresence>
              {selectedQuiz === quiz.title && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.5 }}
                  className="mt-2 overflow-hidden"
                >
                  <div className="p-6 border shadow-md rounded-lg">
                    {quiz.questions.map((question, qIndex) => (
                      <QuizComponent
                        key={qIndex}
                        question={question.question}
                        options={question.options}
                        answer={question.answer}
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
