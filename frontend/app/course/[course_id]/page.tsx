"use client";

import type { Course } from "@/app/types";
import { LoadingSpinner } from "@/components/loading-spinner";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ToastAction } from "@/components/ui/toast";
import { backendAPI } from "@/environment/backend_api";
import { useToast } from "@/hooks/use-toast";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { useLoading } from "@/hooks/useLoading";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BookOpen, FileQuestion, Bot, CalendarRange } from "lucide-react";

export default function CourseHomepage() {
  const router = useRouter();
  const [course, setCourse] = useState<Course>();
  const { loading, startLoading, stopLoading } = useLoading();
  const token = useAuthRedirect();
  const { toast } = useToast();
  const params = useParams<{ course_id: string }>();
  const course_id = params.course_id;

  useEffect(() => {
    if (token) {
      fetchCourseData(course_id);
    }
  }, [token, course_id]);

  const fetchCourseData = async (course_id: string) => {
    startLoading();
    try {
      const response = await backendAPI.get(`/course/${course_id}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      setCourse(response.data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Error fetching course data:" + error,
        variant: "destructive",
        action: <ToastAction altText="Try again">Try again</ToastAction>,
      });
    } finally {
      stopLoading();
    }
  };

  const navigate = (path: string) => {
    router.push(path);
  };

  const iconSize = 48;

  const courseHomepageElements = [
    {
      title: "Flashcards",
      description: "Practice with digital flashcards to reinforce your learning.",
      icon: <BookOpen size={iconSize} className="text-primary/70" strokeWidth={1.5} />,
      path: `/course/${course_id}/flashcards`,
    },
    {
      title: "Quizzes",
      description: "Test your knowledge with interactive quizzes and assessments.",
      icon: <FileQuestion size={iconSize} className="text-primary/70" strokeWidth={1.5} />,
      path: `/course/${course_id}/quizzes`,
    },
    {
      title: "Course Instructor",
      description: `Chat with the AI ${course?.course_name} Instructor.`,
      icon: <Bot size={iconSize} className="text-primary/70" strokeWidth={1.5} />,
      path: `/course/${course_id}/chat`,
    },
    {
      title: "Weekly Study Plan",
      description: "Organize and plan your study sessions for effective learning.",
      icon: <CalendarRange size={iconSize} className="text-primary/70" strokeWidth={1.5} />,
      path: `/course/${course_id}/weekly-study-plan`,
    },
  ];

  if (loading) return <LoadingSpinner />;

  return (
    <main className="-mt-2">
      <div className="mx-auto max-w-6xl p-6">
        <div className="grid grid-cols-1 place-items-stretch gap-8 sm:grid-cols-2">
          {courseHomepageElements.map((element, index) => (
            <Card
              key={index}
              onClick={() => navigate(element.path)}
              className="group relative flex h-full cursor-pointer flex-col justify-between overflow-hidden rounded-xl border border-border/40 bg-card shadow-md transition-all duration-300 hover:border-primary/20 hover:shadow-xl"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-background/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

              <CardHeader className="text-center">
                <CardTitle className="text-xl font-thin text-foreground">{element.title}</CardTitle>
                <CardDescription className="font-thin text-foreground/60">{element.description}</CardDescription>
              </CardHeader>

              <CardContent className="flex h-32 items-center justify-center">
                <div className="rounded-full bg-background/80 p-4 shadow-sm transition-transform duration-300 group-hover:scale-110">
                  {element.icon}
                </div>
              </CardContent>

              <CardFooter className="flex justify-center pb-6">
                <button
                  type="button"
                  className="w-full max-w-xs rounded-full bg-primary/90 px-6 py-3 text-center font-light text-primary-foreground shadow-sm transition-all duration-300 hover:bg-primary hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2"
                >
                  {element.title}
                </button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}
