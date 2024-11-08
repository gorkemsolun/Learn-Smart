"use client";
import { Course } from "@/app/types";
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
import Cookies from "js-cookie";
import { useTheme } from "next-themes";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  FaBook,
  FaCalendarAlt,
  FaClipboardList,
  FaUserTie,
} from "react-icons/fa";
import { IoCloudUploadSharp } from "react-icons/io5";
import UpdateUploadSyllabus from "./upload-syllabus-modal-old";

export default function CourseHomepage() {
  const router = useRouter();
  const { theme } = useTheme();
  const [course, setCourse] = useState<Course>();
  const [loading, setLoading] = useState(true);

  // Loading state is essential to ensure a smooth user experience, especially after a page refresh.
  // This helps handle potential issues with icon themes that may not load correctly due to changes in the current theme.

  const [token] = useState<string>(Cookies.get("authToken") || "");
  const { toast } = useToast();
  const params = useParams<{ course_id: string }>();
  const course_id = params.course_id;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const handleModalOpen = () => setIsModalOpen(true);
  const handleModalClose = () => setIsModalOpen(false);

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

  const handleFlashcardsClick = () => {
    console.log("handleFlashcardsClick");
    // Handle the specific action
  };

  const handleQuizzesClick = () => {
    console.log("handleQuizzesClick");
    // Handle the specific action
  };

  const handleInstructorClick = () => {
    router.push(`/course/${course_id}/instructor`);
  };

  const handleWeeklyStudyPlanClick = () => {
    console.log("handleWeeklyStudyPlanClick");
    // Handle the specific action
  };

  const handleUploadSyllabusClick = () => {
    handleModalOpen();
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
    {
      title: "Upload/Update Syllabus",
      description: "Upload or update the course syllabus.",
      icon: (
        <IoCloudUploadSharp
          className={`text-3xl ${
            theme === "dark" ? "text-white" : "text-black"
          }`}
        />
      ),
      onClick: handleUploadSyllabusClick,
    },
  ];

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
      {isModalOpen && (
        <UpdateUploadSyllabus
          isOpen={isModalOpen}
          modalTitle="Upload/Update Syllabus"
          onClose={handleModalClose}
          course_id={course_id}
        />
      )}
    </main>
  );
}
