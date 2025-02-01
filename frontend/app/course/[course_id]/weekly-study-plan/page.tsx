"use client";

import { backend, backendAPI } from "@/environment/backend_api";
import { useAuthToken } from "@/hooks/useAuthToken";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Markdown from "react-markdown";

export default function WeeklyStudyPlan() {
  // Hooks for authentication, routing, and state management
  const token = useAuthToken();
  const [loading, setLoading] = useState<boolean>(true);
  const [studyPlan, setStudyPlan] = useState<string | null>(null);
  const { course_id } = useParams<{ course_id: string }>();
  const router = useRouter();

  // Redirect to login if no token is found
  useEffect(() => {
    if (!token) {
      router.replace("/login");
    }
  }, [token, router]);

  // Fetch study plan data when the token or course_id changes
  useEffect(() => {
    if (token && course_id) {
      fetchStudyPlanData(course_id);
    }
  }, [token, course_id]);

  // Function to fetch study plan data from the backend
  const fetchStudyPlanData = async (course_id: string) => {
    try {
      setLoading(true);

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
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <span className="ml-2 text-blue-500">Loading your study plan...</span>
      </div>
    );
  }

  // Handle case where no study plan is available
  if (!studyPlan) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-gray-600">No study plan available for this course. 🧐</p>
      </div>
    );
  }

  // Render the study plan using Markdown
  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="prose max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-lg text-gray-800">
        <Markdown>{studyPlan}</Markdown>
      </div>
    </div>
  );
}