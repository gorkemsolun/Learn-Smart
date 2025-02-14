"use client"

import { backendAPI } from "@/environment/backend_api";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { useLoading } from "@/hooks/useLoading";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

export default function CourseQuizList() {
  const token = useAuthRedirect();
  const { loading, startLoading, stopLoading } = useLoading();
  const [quizList, setQuizList] = useState([]);
  const params = useParams<{ course_id: string }>();
  const course_id = params.course_id;

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
      setQuizList(response.data)
      console.log(response.data)
    } catch (error) {
      console.error("Error fetching course data:", error);
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
    <div>
      <h1>Quizzes for Course {course_id}</h1>
    </div>
  );
}