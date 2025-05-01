"use client";

import { chatService } from "@/environment/backend_api";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { useLoading } from "@/hooks/useLoading";
import { LoadingSpinner } from "@/components/loading-spinner";
import FlashcardComponent from "@/components/course/flashcard-component";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Trash2 } from "lucide-react";

export default function CourseFlashCardList() {
  const token = useAuthRedirect();
  const { loading, startLoading, stopLoading } = useLoading();
  const [flashcardList, setFlashcardList] = useState<FlashcardJSON[]>([]);
  const [selectedFlashcardId, setSelectedFlashcardId] = useState<number | null>(null);
  const [editingFlashcardId, setEditingFlashcardId] = useState<number | null>(null);
  const [newFlashcardTitle, setNewFlashcardTitle] = useState("");
  const params = useParams<{ course_id: string }>();
  const course_id = params.course_id;

  interface Flashcard {
    chat_id: number;
    chat_title: string;
    flashcards: FlashcardItem[];
  }

  interface FlashcardItem {
    chat_id: number;
    course_id: number;
    created_at: string;
    flashcard_fid: number;
    flashcard_id: number;
    flashcard_title: string;
    num_flashcards: number;
  }

  interface FlashcardJSON {
    flashcard_id: number;
    chat_title: string;
    flashcard_title: string;
    questions: FlashcardQuestion[];
  }

  interface FlashcardQuestion {
    topic: string;
    explanation: string;
  }

  async function fetchFlashcardQuestions(flashcard_id: number) {
    try {
      const response = await chatService.get(`/flashcard/${flashcard_id}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching flashcard questions:", error);
      return [];
    }
  }

  async function processFlashcardList(data: Flashcard[]) {
    const newFlashcardList: FlashcardJSON[] = [];
    for (const item of data) {
      for (const flashcard of item.flashcards) {
        const questions = await fetchFlashcardQuestions(flashcard.flashcard_id);
        newFlashcardList.push({
          flashcard_id: flashcard.flashcard_id,
          chat_title: item.chat_title,
          flashcard_title: flashcard.flashcard_title,
          questions: questions,
        });
      }
    }
    setFlashcardList(newFlashcardList);
  }

  useEffect(() => {
    if (token) {
      fetchFlashcardList(course_id);
    }
  }, [token, course_id]);

  const fetchFlashcardList = async (course_id: string) => {
    try {
      startLoading();
      const response = await chatService.get(`/course/${course_id}/flashcards`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data: Flashcard[] = response.data.map((item: any) => ({
        chat_id: item.chat_id,
        chat_title: item.chat_title,
        flashcards: item.flashcards.map((flashcard: any) => ({
          flashcard_id: flashcard.flashcard_id,
          chat_id: flashcard.chat_id,
          course_id: flashcard.course_id,
          created_at: flashcard.created_at,
          num_flashcards: flashcard.num_flashcards,
          flashcard_fid: flashcard.flashcard_fid,
          flashcard_title: flashcard.flashcard_title,
        })),
      }));

      await processFlashcardList(data);
    } catch (error) {
      console.error("Error fetching course data:", error);
    } finally {
      stopLoading();
    }
  };

  const handleFlashcardClick = (flashcardId: number) => {
    setSelectedFlashcardId(selectedFlashcardId === flashcardId ? null : flashcardId);
  };

  const handleRenameFlashcard = async (flashcardId: number) => {
    try {
      startLoading();
      await chatService.put(
        `/flashcard/${flashcardId}`,
        { flashcard_title: newFlashcardTitle },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setFlashcardList(flashcardList.map(flashcard => 
        flashcard.flashcard_id === flashcardId ? { ...flashcard, flashcard_title: newFlashcardTitle } : flashcard
      ));
      setEditingFlashcardId(null);
      setNewFlashcardTitle("");
    } catch (error) {
      console.error("Error renaming flashcard:", error);
    } finally {
      stopLoading();
    }
  };

  const handleDeleteFlashcard = async (flashcardId: number) => {
    if (!confirm("Are you sure you want to delete this flashcard set?")) return;
    
    try {
      startLoading();
      await chatService.delete(`/flashcard/${flashcardId}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      setFlashcardList(flashcardList.filter(flashcard => flashcard.flashcard_id !== flashcardId));
    } catch (error) {
      console.error("Error deleting flashcard:", error);
    } finally {
      stopLoading();
    }
  };

  const startEditing = (flashcard: FlashcardJSON) => {
    setEditingFlashcardId(flashcard.flashcard_id);
    setNewFlashcardTitle(flashcard.flashcard_title);
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
      <h1 className="mb-4 text-2xl font-bold">Flashcards</h1>
      <ul className="space-y-4">
        {flashcardList.map((flashcard) => (
          <li key={flashcard.flashcard_id}>
            <div className="overflow-hidden rounded-lg border transition-shadow duration-300 hover:shadow-lg">
              <div
                className="flex cursor-pointer items-center justify-between p-4"
                onClick={() => handleFlashcardClick(flashcard.flashcard_id)}
              >
                <div className="flex-1">
                  {editingFlashcardId === flashcard.flashcard_id ? (
                    <div className="flex gap-2">
                      <Input
                        value={newFlashcardTitle}
                        onChange={(e) => setNewFlashcardTitle(e.target.value)}
                        className="flex-1"
                      />
                      <Button 
                        size="sm" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRenameFlashcard(flashcard.flashcard_id);
                        }}
                      >
                        Save
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingFlashcardId(null);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4">
                      <h2 className="font-semibold">{flashcard.flashcard_title}</h2>
                      <span className="text-sm text-gray-500">
                        ({flashcard.chat_title})
                      </span>
                    </div>
                  )}
                </div>
                <div className="ml-4 flex gap-2">
                  {editingFlashcardId !== flashcard.flashcard_id && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          startEditing(flashcard);
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
                          handleDeleteFlashcard(flashcard.flashcard_id);
                        }}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </>
                  )}
                  <div className="ml-4 text-sm text-gray-500">
                    {flashcard.questions.length} cards
                  </div>
                </div>
              </div>
              <AnimatePresence>
                {selectedFlashcardId === flashcard.flashcard_id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="border-t"
                  >
                    <div className="p-4">
                      <FlashcardComponent
                        flashcards={flashcard.questions.map(q => q.topic)}
                        explanations={flashcard.questions.map(q => q.explanation)}
                      />
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