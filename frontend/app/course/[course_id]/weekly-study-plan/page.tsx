"use client";

import { backend, backendAPI } from "@/environment/backend_api";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Markdown from "react-markdown";
import { useLoading } from "@/hooks/useLoading"; // Import the custom hook
import { LoadingSpinner } from "@/components/loading-spinner";
import { Card } from "@/components/ui/card";

export default function WeeklyStudyPlan() {
  // Hooks for authentication, routing, and state management
  const token = useAuthRedirect();
  const { loading, startLoading, stopLoading } = useLoading(); // Use the custom hook
  const [studyPlan, setStudyPlan] = useState<string | null>(null);
  const { course_id } = useParams<{ course_id: string }>();

  // Fetch study plan data when the token or course_id changes
  useEffect(() => {
    if (token && course_id) {
      fetchStudyPlanData(course_id);
    }
  }, [token, course_id]);

  // Function to fetch study plan data from the backend
  const fetchStudyPlanData = async (course_id: string) => {
    try {
      startLoading(); // Start loading

      // Fetch course details to get the study plan URL
      const courseResponse = await backendAPI.get(`/course/${course_id}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const studyPlanUrl = courseResponse.data.course_study_plan_url;

      // Fetch the actual study plan content
      const studyPlanResponse = await backend.get(studyPlanUrl, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      setStudyPlan(studyPlanResponse.data);
    } catch (error) {
      console.error("Oops! Something went wrong while fetching the study plan:", error);
    } finally {
      stopLoading(); // Stop loading
    }
  };

  // Show loading spinner while loading
  if (loading) {
    return <LoadingSpinner />;
  }

  // Handle case where no study plan is available
  if (!studyPlan) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Card className="p-6 shadow-lg">
          <p className="text-muted-foreground">No study plan available for this course. 🧐</p>
        </Card>
      </div>
    );
  }

  // Render the study plan using Markdown
  return (
    <div className="p-8 bg-muted min-h-screen flex justify-center items-center">
      <Card className="prose max-w-4xl w-full bg-background p-6 rounded-lg shadow-lg text-foreground">
        <Markdown>{studyPlan}</Markdown>
      </Card>
    </div>
  );
}
