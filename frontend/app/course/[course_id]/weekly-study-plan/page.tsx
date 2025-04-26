"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CalendarDays, FileText, Upload } from "lucide-react";

import { LoadingSpinner } from "@/components/loading-spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import UpdateUploadSyllabus from "@/components/upload-syllabus-modal";
import { backend, backendAPI } from "@/environment/backend_api";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { useLoading } from "@/hooks/useLoading";
import { toast } from "@/hooks/use-toast";

type WeekData = {
  label: string
  weekNumber: string
  topic: string
  reading: string
  deliverable: string
}

function parseStudyPlan(md: string): WeekData[] {
  // Fix: Ensure we only match headings like "## Week 2:"
  const weekRegex = /^##\s*Week\s+(\d+):/gim;
  const matches = [...md.matchAll(weekRegex)];
  const weeks: WeekData[] = [];

  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index!;
    const end = i + 1 < matches.length ? matches[i + 1].index! : md.length;
    const weekNumber = matches[i][1];
    const content = md.slice(start, end);

    // Extract each field separately with clear boundaries
    const topic = extractField(content, "Topic");
    const reading = extractField(content, "Reading");
    const deliverable = extractField(content, "Deliverable");

    weeks.push({
      label: `Week ${weekNumber}`,
      weekNumber,
      topic,
      reading,
      deliverable,
    });
  }

  return weeks;
}

function extractField(content: string, fieldName: string): string {
  // Updated regex to better handle field boundaries
  const regex = new RegExp(
    `${fieldName}:\\s*([\\s\\S]*?)(?=\\n(?:\\*\\*?)?(?:Topic|Reading|Deliverable):|\\n##|$)`,
    "i",
  );
  const match = content.match(regex);
  return match ? match[1].trim() : "";
}

export default function WeeklyStudyPlan() {
  const token = useAuthRedirect();
  const { loading, startLoading, stopLoading } = useLoading();
  const [studyPlan, setStudyPlan] = useState<string>("");
  const [weeksData, setWeeksData] = useState<WeekData[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [courseName, setCourseName] = useState<string>("");
  const [syllabusInfo, setSyllabusInfo] = useState<{ url?: string; name?: string }>({});

  const params = useParams();
  const course_id = params?.course_id;

  useEffect(() => {
    if (!course_id) {
      toast({
        title: "Error",
        description: "Course ID is missing from the URL.",
        variant: "destructive",
      });
      return;
    }
    if (token) fetchStudyPlanData(course_id as string);
  }, [token, course_id]);

  useEffect(() => {
    if (studyPlan) {
      setWeeksData(parseStudyPlan(studyPlan));
    }
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

      setCourseName(courseResponse.data.course_name || "Your Course");

      if (courseResponse.data.course_syllabus_url) {
        setSyllabusInfo({
          url: courseResponse.data.course_syllabus_url,
          name: courseResponse.data.course_syllabus_name || "Course Syllabus",
        });
      }

      const studyPlanUrl = courseResponse.data.course_study_plan_url;
      if (!studyPlanUrl) return;

      const studyPlanResponse = await backend.get(studyPlanUrl, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = studyPlanResponse.data;
      if (typeof data === "string" && data.trim().length > 0) {
        setStudyPlan(data);
        console.log(data);
      }
    } catch (error) {
      console.error("Error fetching study plan:", error);
      toast({
        title: "Error",
        description: "Failed to load study plan. Please try again.",
        variant: "destructive",
      });
    } finally {
      stopLoading();
    }
  };

  const handleRefresh = () => {
    if (token && course_id) fetchStudyPlanData(course_id as string);
  };

  const handleUploadSuccess = () => {
    setIsModalOpen(false);
    handleRefresh();
    toast({
      title: "Success",
      description: "Syllabus uploaded successfully.",
    });
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="h-[92vh] bg-gradient-to-b from-muted/50 to-background p-6">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-3xl font-thin tracking-tight">{courseName}</h1>
          <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 font-light">
            <Upload className="size-4" />
            <span>Upload/Update Syllabus</span>
          </Button>
        </header>

        <UpdateUploadSyllabus
          isOpen={isModalOpen}
          modalTitle="Upload or Update Syllabus"
          onClose={() => setIsModalOpen(false)}
          onUploadSuccess={handleUploadSuccess}
          course_id={course_id as string}
          existingSyllabus={syllabusInfo}
        />

        {weeksData.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {weeksData.map((week, idx) => (
              <Card key={idx} className="overflow-hidden transition-all hover:shadow-md">
                <CardHeader className="bg-muted/50 pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="mt-2 text-lg font-semibold">
                      {week.label.replace(/Week \d+:\s*/i, "")}
                    </CardTitle>
                    <CalendarDays className="size-4 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent className="pt-2">
                  {week.topic && (
                    <div className="mb-3">
                      <h4 className="text-sm font-medium text-muted-foreground">Topic</h4>
                      <p className="mt-1 font-light">{week.topic}</p>
                    </div>
                  )}
                  {week.reading && (
                    <div className="mb-3">
                      <h4 className="text-sm font-medium text-muted-foreground">Reading</h4>
                      <p className="mt-1 font-light">{week.reading}</p>
                    </div>
                  )}
                  {week.deliverable && (
                    <div className="mb-3">
                      <h4 className="text-sm font-medium text-muted-foreground">Deliverable</h4>
                      <p className="mt-1 font-light">{week.deliverable}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
            <FileText className="mb-4 size-12 text-muted-foreground/50" />
            <h3 className="text-lg font-medium">No study plan available</h3>
            <p className="mt-2 text-sm font-light text-muted-foreground">
              Upload your course syllabus to generate a personalized weekly study plan.
            </p>
            <Button onClick={() => setIsModalOpen(true)} variant="outline" className="mt-4">
              Upload Syllabus
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
