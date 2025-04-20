"use client";

import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Card } from "@/components/ui/card";
import UpdateUploadSyllabus from "@/components/upload-syllabus-modal";
import { backend, backendAPI } from "@/environment/backend_api";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { useLoading } from "@/hooks/useLoading";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

// Dummy fallback study plan in Markdown
const defaultStudyPlan = `
# Weekly Study Plan

## Week 1: Introduction & Setup
- Topic: Course Overview & Tools Setup
- Activities: Install required software, review syllabus, join discussion channels
- Deliverable: Setup confirmation screenshot

## Week 2: Fundamentals
- Topic: Core Concepts & Terminology
- Activities: Read Chapters 1-2, complete quiz
- Deliverable: Quiz results & summary notes

## Week 3: Deep Dive
- Topic: Advanced Patterns
- Activities: Watch lecture videos, build sample project
- Deliverable: Sample project code on GitHub

## Week 4: Hands-On Practice
- Topic: Case Studies
- Activities: Group workshop, peer review
- Deliverable: Workshop feedback document

## Week 5: Review & Assessment
- Topic: Comprehensive Review
- Activities: Revision session, practice exam
- Deliverable: Completed practice exam

## Week 6: Final Project
- Topic: Integration & Deployment
- Activities: Develop final project, deploy to staging
- Deliverable: Live project link & documentation
`;

// Parse Markdown into structured week data
function parseStudyPlan(md: string) {
  const regex = /##\s*([^\n]+)\n([\s\S]*?)(?=(##\s*|$))/g;
  const matches = Array.from(md.matchAll(regex));
  return matches.map((match) => {
    const title = match[1].trim();
    const content = match[2];
    const items = content
      .split("\n")
      .filter((line) => line.startsWith("-"))
      .map((line) => line.replace(/^-+\s*/, "").trim());
    return { title, items };
  });
}

export default function WeeklyStudyPlan() {
  const token = useAuthRedirect();
  const { loading, startLoading, stopLoading } = useLoading();
  const [studyPlan, setStudyPlan] = useState<string>(defaultStudyPlan);
  const [weeksData, setWeeksData] = useState<
    { title: string; items: string[] }[]
  >(parseStudyPlan(defaultStudyPlan));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { course_id } = useParams<{ course_id: string }>();

  useEffect(() => {
    if (token && course_id) fetchStudyPlanData(course_id);
  }, [token, course_id]);

  useEffect(() => {
    setWeeksData(parseStudyPlan(studyPlan));
  }, [studyPlan]);

  const fetchStudyPlanData = async (course_id: string) => {
    try {
      startLoading();
      const courseResponse = await backendAPI.get(`/course/${course_id}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const studyPlanUrl = courseResponse.data.course_study_plan_url;
      const studyPlanResponse = await backend.get(studyPlanUrl, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = studyPlanResponse.data;
      if (data && typeof data === "string" && data.trim().length > 0) {
        setStudyPlan(data);
      }
    } catch (error) {
      console.error("Error fetching study plan:", error);
    } finally {
      stopLoading();
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="bg-muted relative flex min-h-screen items-center justify-center p-8">
      <button
        onClick={() => setIsModalOpen(true)}
        type="button"
        className="absolute right-4 top-4 rounded-lg bg-gray-700 px-4 py-2 text-white transition hover:bg-gray-900"
      >
        Update Syllabus
      </button>

      <UpdateUploadSyllabus
        isOpen={isModalOpen}
        modalTitle="Upload or Update Syllabus"
        onClose={() => setIsModalOpen(false)}
        course_id={course_id!}
      />

      <div className="grid w-full max-w-5xl grid-cols-3 grid-rows-2 gap-6">
        {weeksData.map((week, idx) => (
          <Card key={idx} className="p-4">
            <h3 className="mb-2 text-lg font-semibold">{week.title}</h3>
            <ul className="list-inside list-disc space-y-1">
              {week.items.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </div>
  );
}
