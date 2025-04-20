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
    startLoading();
    router.push(path);
  };

  const iconStyle = "text-4xl text-gray-300"; // slightly darker than before

  const courseHomepageElements = [
    {
      title: "Flashcards",
      description: "Practice with digital flashcards.",
      icon: <FaBook className={iconStyle} />,
      onClick: () => navigate(`/course/${course_id}/flashcards`),
    },
    {
      title: "Quizzes",
      description: "Take interactive quizzes.",
      icon: <FaClipboardList className={iconStyle} />,
      onClick: () => navigate(`/course/${course_id}/quizzes`),
    },
    {
      title: `Go to ${course?.course_name} Instructor`,
      description: `Ask ${course?.course_name} Instructor through chatbot.`,
      icon: <FaUserTie className={iconStyle} />,
      onClick: () => navigate(`/course/${course_id}/instructor`),
    },
    {
      title: "Weekly study plan",
      description: "Plan your study sessions for the week.",
      icon: <FaCalendarAlt className={iconStyle} />,
      onClick: () => navigate(`/course/${course_id}/weekly-study-plan`),
    },
  ];

  if (loading) return <LoadingSpinner />;

  return (
    <main className="min-h-screen  text-white">
      <div className="mx-auto max-w-6xl p-6">
        <div className="grid grid-cols-1 place-items-stretch gap-8 sm:grid-cols-2">
          {courseHomepageElements.map((element, index) => (
            <Card
              key={index}
              className="to-gray-750 flex h-full flex-col justify-between rounded-2xl bg-gradient-to-br from-gray-900 shadow-xl transition-transform duration-300 hover:scale-105 hover:shadow-2xl"
            >
              <CardHeader className="text-center">
                <CardTitle className="text-lg font-semibold">
                  {element.title}
                </CardTitle>
                <CardDescription className="text-gray-400">
                  {element.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex h-32 items-center justify-center">
                {element.icon}
              </CardContent>
              <CardFooter className="flex justify-center pb-6">
                <button
                  onClick={element.onClick}
                  type="button"
                  className="w-full max-w-xs rounded-full bg-gradient-to-r from-gray-700 to-gray-500 px-6 py-2 text-center font-medium text-white transition-opacity duration-300 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
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
