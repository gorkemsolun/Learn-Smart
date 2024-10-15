"use client";
import * as React from "react";
import {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Cookies from "js-cookie";
import { Course } from "@/app/types";
import { backendAPI } from "@/environment/backend_api";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { FaBook, FaCalendarAlt, FaClipboardList, FaUserTie } from "react-icons/fa";
import { IoCloudUploadSharp } from "react-icons/io5";
import { useTheme } from "next-themes";

export default function CourseHomepage() {
  const { theme } = useTheme();
  const [course, setCourse] = useState<Course>();
  const [loading, setLoading] = useState(true);
  // Loading state is essential to ensure a smooth user experience, especially after a page refresh. 
  // This helps handle potential issues with icon themes that may not load correctly due to changes in the current theme.
  const [token] = useState<string>(Cookies.get("authToken") || "");
  const { toast } = useToast();
  const params = useParams<{ course_id: string }>();
  const course_id = params.course_id;

  useEffect(() => {
    if (token) {
      fetchCourseData(course_id);
    }
  }, [token, course_id]);

  const fetchCourseData = async (course_id: string) => {
    setLoading(true);
    try {
      // TODO: PUT THIS CODE DUPLICATION TO A GENERALIZED FOLDER
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
      setLoading(false);
    }
  };

  const courseHomepageElements = [
    {
      title: "Flashcards",
      description: "Practice with digital flashcards.",
      icon: <FaBook className={`text-3xl ${theme === 'dark' ? 'text-white' : 'text-black'}`} />,
      router: `/flashcards`,
    },
    {
      title: "Quizzes",
      description: "Take interactive quizzes.",
      icon: <FaClipboardList className={`text-3xl ${theme === 'dark' ? 'text-white' : 'text-black'}`} />,
      router: `/quizzes`,
    },
    {
      title: `Go to ${course?.course_name} Instructor`,
      description: `Ask ${course?.course_name} Instructor through chatbot.`,
      icon: <FaUserTie className={`text-3xl ${theme === 'dark' ? 'text-white' : 'text-black'}`} />,
      router: `/instructor`,
    },
    {
      title: "Weekly study plan",
      description: "Plan your study sessions for the week.",
      icon: <FaCalendarAlt className={`text-3xl ${theme === 'dark' ? 'text-white' : 'text-black'}`} />,
      router: `/weekly-study-plan`,
    },
    {
      title: "Upload/Update Syllabus",
      description: "Upload or update the course syllabus.",
      icon: <IoCloudUploadSharp className={`text-3xl ${theme === 'dark' ? 'text-white' : 'text-black'}`} />,
      router: `/upload-syllabus`,
    },
  ];

  return (
    <div className="p-6 space-y-6">
    {loading ? (
      <div className="text-center">Loading...</div>
    ) : (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {courseHomepageElements.map((element, index) => (
          <Card key={index} className="flex flex-col justify-between h-full">
            <CardHeader className="text-center">
              <CardTitle className="text-lg font-semibold">{element.title}</CardTitle>
              <CardDescription className="text-gray-500">{element.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center items-center h-32">
              {element.icon}
            </CardContent>
            <CardFooter className="flex justify-center">
              <a
                href={element.router}
                className="px-6 py-2 bg-black text-white rounded-full hover:bg-gray-700 transition duration-300 w-full text-center max-w-xs"
              >
                {element.title}
              </a>
            </CardFooter>
          </Card>
        ))}
      </div>
    )}
  </div>
  );
}
