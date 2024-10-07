"use client";

import "@/app/style/course-homepage.css";
import { backend, backendAPI } from "@/environment/backend_api";
import Cookies from "js-cookie";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Markdown from "../../../components/markdown-renderer";

export default function StudyPlan() {
  const [token, setToken] = useState<string>("");
  const [studyPlan, setStudyPlan] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const params = useParams<{ course_id: string }>();
  const course_id = params.course_id;
  const router = useRouter();

  useEffect(() => {
    setToken(Cookies.get("authToken") || "");
  }, []);

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

      // TODO:

      /*

        await backendAPI.get(`${studyPlanUrl}`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        
              // => This gives the location: http://localhost:8000/api/files/course_2/study_plan.md
             // When api is removed from the path, the component works as expected
        
      */

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

  const handleBack = () => {
    router.back();
  };

  return (
    <div className="p-6 bg-white shadow-lg rounded-lg max-w-3xl mx-auto border border-gray-200">
      <div className="flex items-center mb-6">
        <button
          onClick={handleBack}
          className="bg-blue-500 text-white px-6 py-2 rounded-full hover:bg-blue-600 transition-colors duration-300 ease-in-out shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 mr-auto"
        >
          Back
        </button>
        <h1 className="text-3xl font-bold text-gray-800 mx-auto tracking-wide">
          Study Plan
        </h1>
      </div>
      {loading ? (
        <div className="text-center text-lg text-gray-600 animate-pulse">
          Loading...
        </div>
      ) : studyPlan ? (
        <Markdown markdown_content={studyPlan} />
      ) : (
        <div className="text-center text-red-600 font-semibold">
          Syllabus is not uploaded.
        </div>
      )}
    </div>
  );
}
