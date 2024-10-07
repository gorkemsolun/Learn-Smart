"use client";

import UpdateUploadSyllabus from "@/app/components/modals/upload-syllabus-modal";
import Navbar from "@/app/components/navbar/navbar";
import "@/app/style/course-homepage.css";
import { backendAPI } from "@/environment/backend_api";
import Cookies from "js-cookie";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  FaBook,
  FaCalendarAlt,
  FaClipboardList,
  FaUserTie,
} from "react-icons/fa";
import {
  Course,
  CourseHomepageElement,
  CourseHomepageParameters,
} from "../../types";
import { IoCloudUploadSharp } from "react-icons/io5";

export default function CourseHomepage(parameters: CourseHomepageParameters) {
  const [course, setCourse] = useState<Course>();
  const [token, setToken] = useState<string>(Cookies.get("authToken") || "");
  const pathname = usePathname();
  const params = useParams<{ course_id: string }>();
  const course_id = params.course_id;
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const handleModalOpen = () => setIsModalOpen(true);
  const handleModalClose = () => setIsModalOpen(false);

  useEffect(() => {
    if (token) {
      fetchCourseData(course_id);
    }
  }, [token, course_id]);

  const fetchCourseData = async (course_id: string) => {
    await backendAPI
      .get(`/course/${course_id}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => setCourse(response.data))
      .catch((error) => {
        console.error("Error fetching course data:", error);
      });
  };

  if (token == null) {
    router.replace("/login");
  }

  if (!course) {
    return (
      <div className="bg-transparent min-h-screen text-black">Loading...</div>
    );
  }

  let courseHomepageElements: CourseHomepageElement[] = [
    {
      course_homepage_element_name: "Flashcards",
      course_homepage_element_explanation: "Practice with digital flashcards.",
      course_homepage_element_router: (
        <Link
          className="px-4 py-2 bg-black text-white rounded-full hover:bg-gray-700 transition duration-300 inline-block"
          href={`${pathname}/flashcards`}
        >
          Flashcards
        </Link>
      ),
      course_homepage_element_component: (
        <FaBook className="text-3xl text-white" />
      ),
    },
    {
      course_homepage_element_name: "Quizzes",
      course_homepage_element_explanation: "Take interactive quizzes.",
      course_homepage_element_router: (
        <Link
          title="quizzes"
          className="px-4 py-2 bg-black text-white rounded-full hover:bg-gray-700 transition duration-300 inline-block"
          href={`${pathname}/quizzes`}
        >
          Quizzes
        </Link>
      ),
      course_homepage_element_component: (
        <FaClipboardList className="text-3xl text-white" />
      ),
    },
    {
      course_homepage_element_name: `Go to ${course.course_name} Instructor`,
      course_homepage_element_explanation: `Ask ${course.course_name} Instructor through chatbot.`,
      course_homepage_element_router: (
        <a
          title="Go to Instructor"
          className="px-4 py-2 bg-black text-white rounded-full hover:bg-gray-700 transition duration-300 inline-block"
          href={`${pathname}/instructor`}
        >
          Go to Instructor
        </a>
      ),
      course_homepage_element_component: (
        <FaUserTie className="text-3xl text-white" />
      ),
    },
    {
      course_homepage_element_name: "Weekly study plan",
      course_homepage_element_explanation:
        "Plan your study sessions for the week.",
      course_homepage_element_router: (
        <a
          title="Weekly Study Plan"
          className="px-4 py-2 bg-black text-white rounded-full hover:bg-gray-700 transition duration-300 inline-block"
          href={`${pathname}/weekly-study-plan`}
        >
          Weekly Study Plan
        </a>
      ),
      course_homepage_element_component: (
        <FaCalendarAlt className="text-3xl text-white" />
      ),
    },
    {
      course_homepage_element_name: "Upload/Update Syllabus",
      course_homepage_element_explanation:
        "Upload or update the course syllabus.",
      course_homepage_element_router: (
        <button
          title="Upload/Update Syllabus"
          className="px-4 py-2 bg-black text-white rounded-full hover:bg-gray-700 transition duration-300 inline-block"
          onClick={handleModalOpen}
        >
          Upload/Update Syllabus
        </button>
      ),
      course_homepage_element_component: (
        <IoCloudUploadSharp className="text-3xl text-white" />
      ),
    },
  ];

  return (
    <main className="bg-transparent min-h-screen text-black">
      <Navbar />
      <div className="relative overflow-hidden">
        <div className="max-w-8xl mx-auto py-6 px-6 text-black">
          <div className="text-left mb-12">
            <h1 className="text-4xl font-bold text-left">
              <span className="font-light">Welcome to your </span>
              <span className="font-normal text-gray-800">
                {course.course_name}
              </span>
            </h1>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {courseHomepageElements.map(
              (
                {
                  course_homepage_element_name,
                  course_homepage_element_explanation,
                  course_homepage_element_router,
                  course_homepage_element_component,
                },
                index
              ) => (
                <div
                  key={index}
                  className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center justify-center"
                >
                  <div className="bg-black p-3 rounded-full mb-4">
                    {course_homepage_element_component}
                  </div>
                  <div className="text-center">
                    <h3 className="text-xl font-medium mb-2 text-black">
                      {course_homepage_element_name}
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">
                      {course_homepage_element_explanation}
                    </p>
                    {course_homepage_element_router}
                  </div>
                </div>
              )
            )}
          </div>
        </div>
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
