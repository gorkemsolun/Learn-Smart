"use client"

import { backendAPI } from "@/environment/backend_api";
import { useAuthToken } from "@/hooks/useAuthToken";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function CourseFlashCardList() {
  const token = useAuthToken();
  const [loading, setLoading] = useState<boolean>(true);
  const [flashcardList, setFlashcardList] = useState([]);
  const params = useParams<{ course_id: string }>();
  const course_id = params.course_id;
  const router = useRouter();

  useEffect(() => {
    if (token) {
      fetchFlashcardList(course_id);
    }
  }, [token, course_id]);

  if (token == null) {
    router.replace("/login");
  }

  const fetchFlashcardList = async (course_id: string) => {
    try {
      setLoading(true);
      const response = await backendAPI.get(`/course/${course_id}/flashcards`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      setFlashcardList(response.data)
      console.log(flashcardList)
    } catch (error) {
      console.error("Error fetching course data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!flashcardList || flashcardList.length === 0) {
    return <div>No flashcards available.</div>
  }

  return (
    <div>
      <h2>flashcards</h2> {/* 10.11.2024 current chat does note create quizzes or flashcards */}
    </div>
  );
}