"use client";

import "@/app/style/course-homepage.css";
import { backend, backendAPI } from "@/environment/backend_api";
import Cookies from "js-cookie";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

interface WeekData {
  weekNo: string;
  topic: string;
  activities: string;
}
export default function StudyPlan() {
  const [token, setToken] = useState<string>("");
  const [studyPlan, setStudyPlan] = useState<string>("");
  const [weekData, setWeekData] = useState<WeekData[]>([]);
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

  const parseStudyPlan = (studyPlan: string) => {
    const weeks = studyPlan.split('**Week');
    weeks.splice(0,1);
    return weeks
      .filter(week => week.trim()) 
      .map((weekContent, index) => {
        const weekNo = weekContent.match(/(\d+):/)[1]; // Extract week number
        const splitTopic = weekContent.split("- Topic:");
        //resulting split has the week number as the first element and topic and activities as the rest
        splitTopic.splice(0,1) //remove the week number
        const splitActivities = splitTopic[0].split("- Activities:"); //split the combined topic and activities
        const topic = splitActivities[0].trim() // first element is the topic
        const activities = splitActivities[1].trim(); // second element is the activities part
        return { weekNo, topic, activities};
      });
  };

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
      setWeekData(parseStudyPlan(studyPlanResponse.data));
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
    <div className="p-6 bg-white shadow-lg rounded-lg max-w-5xl mx-auto border border-gray-200">
      <div className="flex flex-col items-center mb-6 ">
        <button
          onClick={handleBack}
          className="bg-blue-500 text-white px-6 py-2 rounded-full hover:bg-blue-600 transition-colors duration-300 ease-in-out shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 mr-auto"
        >
          Back
        </button>
        <h1 className="text-3xl font-bold text-gray-800 tracking-wide text-center">
          Study Plan
        </h1>
      </div>
      {loading ? (
        <div className="text-center text-lg text-gray-600 animate-pulse">
          Loading...
        </div>
      ) : studyPlan ? (
        <Accordion type="multiple">
        {weekData.map((week, index) => (
          <AccordionItem value={`item-${index + 1}`} key={index}>
            <AccordionTrigger>Week {week.weekNo}</AccordionTrigger>
            <AccordionContent>
            <b>{week.topic}</b>
            <div style={{ marginTop: '10px' }}>{week.activities}</div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      ) : (
        <div className="text-center text-red-600 font-semibold">
          Syllabus is not uploaded.
        </div>
      )}
    </div>
  );
}
