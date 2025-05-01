"use client";

import { CalendarDays, FileText, Upload } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";

import { Course } from "@/app/types";
import { CourseDialogModal } from "@/components/course/course-dialog";
import { LoadingSpinner } from "@/components/loading-spinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { courseService, filemanagerService } from "@/environment/backend_api";
import { toast } from "@/hooks/use-toast";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { useLoading } from "@/hooks/useLoading";

type WeekData = {
  label: string;
  weekNumber: string;
  topic: string;
  reading: string;
  deliverable: string;
};

function parseStudyPlan(md: string): WeekData[] {
  const weekRegex = /^##\s*Week\s+(\d+):/gim;
  const matches = [...md.matchAll(weekRegex)];
  const weeks: WeekData[] = [];

  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index!;
    const end = i + 1 < matches.length ? matches[i + 1].index! : md.length;
    const weekNumber = matches[i][1];
    const content = md.slice(start, end);
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
  const regex = new RegExp(
    `${fieldName}:\\s*([\\s\\S]*?)(?=\\n(?:\\*\\*?)?(?:Topic|Reading|Deliverable):|\\n##|$)`,
    "i"
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
  const [course, setCourse] = useState<Course>({} as Course);

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

  // Updated: clear weeksData when studyPlan is empty
  useEffect(() => {
    if (studyPlan) {
      setWeeksData(parseStudyPlan(studyPlan));
    } else {
      setWeeksData([]);
    }
  }, [studyPlan]);

  const fetchStudyPlanData = async (course_id: string) => {
    try {
      startLoading();

      const courseResponse = await courseService.get(`/${course_id}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      setCourse(courseResponse.data);

      // Fix: check correct field for study plan
      if (courseResponse.data.course_study_plan_fid) {
        const response = await filemanagerService.get(
          `/${courseResponse.data.course_study_plan_fid}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const studyPlanResponse = await fetch(response.data.file_url);
        const data = await studyPlanResponse.text();
        setStudyPlan(data);
      } else {
        setStudyPlan("");
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
    if (token && course_id) {
      fetchStudyPlanData(course_id as string);
    }
  };

  const onCourseUpdate = () => {
    setIsModalOpen(false);
    handleRefresh();
    toast({
      title: "Success",
      description: "Syllabus uploaded successfully.",
    });
  };

  if (loading) {
    return <LoadingSpinner />;
  } else {
    return (
      <div className="h-[92vh] bg-gradient-to-b from-muted/50 to-background p-6">
        <div className="mx-auto max-w-7xl">
          <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-3xl font-thin tracking-tight">
              {course.course_name}
            </h1>
            <Button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 font-light"
            >
              <Upload className="size-4" />
              <span>Upload/Update Syllabus</span>
            </Button>
          </header>

          <CourseDialogModal
            isCreate={false}
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            course={course}
            onCourseUpdate={onCourseUpdate}
            isFromSyllabusPage={true}
          />

          {weeksData.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {weeksData.map((week, idx) => (
                <Card
                  key={idx}
                  className="overflow-hidden transition-all hover:shadow-md"
                >
                  <CardHeader className="bg-muted/50 pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="mt-2 text-lg font-semibold">
                        {week.label.replace(/Week \\d+:\\s*/i, "")}
                      </CardTitle>
                      <CalendarDays className="size-4 text-muted-foreground" />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-2">
                    {week.topic && (
                      <div className="mb-3">
                        <h4 className="text-sm font-medium text-muted-foreground">
                          Topic
                        </h4>
                        <p className="mt-1 font-light">{week.topic}</p>
                      </div>
                    )}
                    {week.reading && (
                      <div className="mb-3">
                        <h4 className="text-sm font-medium text-muted-foreground">
                          Reading
                        </h4>
                        <p className="mt-1 font-light">{week.reading}</p>
                      </div>
                    )}
                    {week.deliverable && (
                      <div className="mb-3">
                        <h4 className="text-sm font-medium text-muted-foreground">
                          Deliverable
                        </h4>
                        <p className="mt-1 font-light">{week.deliverable}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : studyPlan ? (
            <div className="prose max-w-none">
              <ReactMarkdown>{studyPlan}</ReactMarkdown>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
              <FileText className="mb-4 size-12 text-muted-foreground/50" />
              <h3 className="text-lg font-medium">No study plan available</h3>
              <p className="mt-2 text-sm font-light text-muted-foreground">
                Upload your course syllabus to generate a personalized weekly
                study plan.
              </p>
              <Button
                onClick={() => setIsModalOpen(true)}
                variant="outline"
                className="mt-4"
              >
                Upload Syllabus
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }
}
