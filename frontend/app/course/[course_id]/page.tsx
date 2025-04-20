"use client";
import { Course } from "@/app/types";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ToastAction } from "@/components/ui/toast";
import { backendAPI } from "@/environment/backend_api";
import { useToast } from "@/hooks/use-toast";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { useLoading } from "@/hooks/useLoading";
import { useTheme } from "next-themes";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  FaBook,
  FaCalendarAlt,
  FaClipboardList,
  FaUserTie,
} from "react-icons/fa";

export default function CourseHomepage() {
  const router = useRouter();
  const { theme } = useTheme();
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

  const handleFlashcardsClick = () => {
    startLoading();
    router.push(`/course/${course_id}/flashcards`);
  };

  const handleQuizzesClick = () => {
    startLoading();
    router.push(`/course/${course_id}/quizzes`);
  };

  const handleInstructorClick = () => {
    startLoading();
    router.push(`/course/${course_id}/instructor`);
  };

  const handleWeeklyStudyPlanClick = () => {
    startLoading();
    router.push(`/course/${course_id}/weekly-study-plan`);
  };

  const courseHomepageElements = [
    {
      title: "Flashcards",
      description: "Practice with digital flashcards.",
      icon: (
        <FaBook
          className={`text-3xl ${
            theme === "dark" ? "text-white" : "text-black"
          }`}
        />
      ),
      onClick: handleFlashcardsClick,
    },
    {
      title: "Quizzes",
      description: "Take interactive quizzes.",
      icon: (
        <FaClipboardList
          className={`text-3xl ${
            theme === "dark" ? "text-white" : "text-black"
          }`}
        />
      ),
      onClick: handleQuizzesClick,
    },
    {
      title: `Go to ${course?.course_name} Instructor`,
      description: `Ask ${course?.course_name} Instructor through chatbot.`,
      icon: (
        <FaUserTie
          className={`text-3xl ${
            theme === "dark" ? "text-white" : "text-black"
          }`}
        />
      ),
      onClick: handleInstructorClick,
    },
    {
      title: "Weekly study plan",
      description: "Plan your study sessions for the week.",
      icon: (
        <FaCalendarAlt
          className={`text-3xl ${
            theme === "dark" ? "text-white" : "text-black"
          }`}
        />
      ),
      onClick: handleWeeklyStudyPlanClick,
    },
  ];

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <main className="min-h-screen bg-transparent text-black">
      <div className="space-y-6 p-6">
        {loading ? (
          <div className="text-center">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {courseHomepageElements.map((element, index) => (
              <Card
                key={index}
                className="flex h-full flex-col justify-between"
              >
                <CardHeader className="text-center">
                  <CardTitle className="text-lg font-semibold">
                    {element.title}
                  </CardTitle>
                  <CardDescription className="text-gray-500">
                    {element.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex h-32 items-center justify-center">
                  {element.icon}
                </CardContent>
                <CardFooter className="flex justify-center">
                  <div
                    onClick={element.onClick}
                    className="w-full max-w-xs cursor-pointer rounded-full bg-black px-6 py-2 text-center text-white transition duration-300 hover:bg-gray-700"
                  >
                    {element.title}
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
