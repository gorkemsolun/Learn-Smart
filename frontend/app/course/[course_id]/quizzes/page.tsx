"use client"

import { backendAPI } from "@/environment/backend_api";
import { useAuthToken } from "@/hooks/useAuthToken";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function CourseQuizList() {
  const token = useAuthToken();
  const [loading, setLoading] = useState<boolean>(true);
  const [quizList, setQuizList] = useState([]);
  const params = useParams<{ course_id: string }>();
  const course_id = params.course_id;
  const router = useRouter();

  useEffect(() => {
    if (token) {
      fetchQuizList(course_id);
    }
  }, [token, course_id]);

  if (token == null) {
    router.replace("/login");
  }

  const fetchQuizList = async (course_id: string) => {
    try {
      setLoading(true);
      const response = await backendAPI.get(`/course/${course_id}/quizzes`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      setQuizList(response.data)
    } catch (error) {
      console.error("Error fetching course data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!quizList || quizList.length === 0) {
    return <div>No quiz available.</div>;
  }

  return (
    <div>
      <h1>Quizzes for Course {course_id}</h1>
      <ul>
        {quizList.map((quiz, index) => (
          <li key={index}>
            <h2>{quiz}</h2> {/* 10.11.2024 current chat does note create quizzes or flashcards */}
          </li>
        ))}
      </ul>
    </div>
  );
}