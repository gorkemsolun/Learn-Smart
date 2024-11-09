"use client"

import { backend, backendAPI } from "@/environment/backend_api";
import { useAuthToken } from "@/hooks/useAuthToken";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Markdown from "react-markdown";

export default function WeeklyStudyPlan() {
  const token = useAuthToken();
  const [loading, setLoading] = useState<boolean>(true);
  const [studyPlan, setStudyPlan] = useState(null);
  const params = useParams<{ course_id: string }>();
  const course_id = params.course_id;
  const router = useRouter();

  useEffect(() => {
    if (token) {
      fetchStudyPlanData(course_id);
    }
  }, [token, course_id]);

  if (token == null) {
    router.replace("/login");
  }

  const fetchStudyPlanData = async (course_id: string) => {
    try {
      setLoading(true);
      const response = await backendAPI.get(`/course/${course_id}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      
      const studyPlanUrl = response.data.course_study_plan_url;
      const studyPlanResponse = await backend.get(`${studyPlanUrl}`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      setStudyPlan(studyPlanResponse.data);
    } catch (error) {
      console.error("Error fetching course data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!studyPlan) {
    return <div>No study plan available.</div>;
  }

  return (
    <div>
      <pre><Markdown>{studyPlan}</Markdown></pre>
    </div>
  );
}
