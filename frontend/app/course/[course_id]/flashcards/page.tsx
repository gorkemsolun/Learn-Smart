"use client";

import { backendAPI } from "@/environment/backend_api";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { useLoading } from "@/hooks/useLoading";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import FlashcardComponent from "@/components/flashcard-component";
import { motion, AnimatePresence } from "framer-motion";

export default function CourseFlashCardList() {
  const token = useAuthRedirect();
  const { loading, startLoading, stopLoading } = useLoading();
  const [flashcardList, setFlashcardList] = useState<
    Array<{
      chat_id: number;
      filename: string;
      content: {
        flashcards: string[];
        explanations: string[];
      };
    }>
  >([]);
  const [selectedFilename, setSelectedFilename] = useState<string | null>(null);
  const params = useParams<{ course_id: string }>();
  const course_id = params.course_id;

  useEffect(() => {
    if (token) {
      fetchFlashcardList(course_id);
    }
  }, [token, course_id]);

  const fetchFlashcardList = async (course_id: string) => {
    try {
      startLoading();
      const response = await backendAPI.get(`/course/${course_id}/flashcards`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      setFlashcardList(response.data);
      console.log(response.data)
    } catch (error) {
      console.error("Error fetching course data:", error);
    } finally {
      stopLoading();
    }
  };

  const handleFilenameClick = (filename: string) => {
    setSelectedFilename(selectedFilename === filename ? null : filename);
  };

  if (loading) return <LoadingSpinner />;
  if (!flashcardList || flashcardList.length === 0) {
    return (
      <Card className="text-center">
        <CardHeader>
          <h2 className="text-xl font-semibold">No Flashcards Available</h2>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            It looks like there are no flashcards to display at the moment.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Flashcards</h1>
      <ul>
        {flashcardList.map((item) => (
          <li key={item.chat_id} className="mb-4">
            <div
              className="cursor-pointer p-2 border rounded-lg hover:bg-gray-200"
              onClick={() => handleFilenameClick(item.filename)}
            >
              <h2 className="font-semibold">{item.filename}</h2>
            </div>
            <AnimatePresence>
              {selectedFilename === item.filename && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.5 }}
                  className="mt-2 overflow-hidden"
                >
                  <div className="p-6 border shadow-md rounded-lg">
                    <FlashcardComponent
                      flashcards={item.content.flashcards}
                      explanations={item.content.explanations}
                    />
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
