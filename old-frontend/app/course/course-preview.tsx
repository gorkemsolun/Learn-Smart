import CourseHomepage from "@/app/course/[course_id]/page";
import "@/app/style/course-preview.css";
import { backendAPI } from "@/environment/backend_api";
import Cookies from "js-cookie";
import { useEffect, useState } from "react";
import CreateCourseModal from "../components/modals/create-course-modal";
import { Course } from "../types";
import CourseCard from "./course-card";

export default function CoursePreview() {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [token, setToken] = useState<string>(Cookies.get("authToken") || "");
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    if (token) {
      fetchCourses();
    }
  }, [token]);

  const fetchCourses = async () => {
    try {
      const response = await backendAPI.get(`/users/me`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      setCourses(response.data["courses"]);
    } catch (error) {
      console.error("Error fetching course data:", error);
    }
  };

  const handleCourseCreation = () => {
    setIsModalOpen(false);
    fetchCourses();
  };

  return (
    <div>
      {selectedCourseId ? (
        <CourseHomepage />
      ) : (
        <div className="flex flex-wrap gap-4">
          {courses.map((course) => (
            <CourseCard key={course.course_id} course={course} />
          ))}
          <button
            onClick={() => setIsModalOpen(true)}
            className="course-card flex items-center justify-center w-48 h-32 bg-gray-200 shadow-lg text-gray-500 text-lg"
            type="button"
          >
            + Add Course
          </button>
          <div>
            <CreateCourseModal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              modalTitle="Add New Site"
              onCourseCreation={handleCourseCreation}
            />
          </div>
        </div>
      )}
      {selectedCourseId && (
        <button
          onClick={() => setSelectedCourseId("")}
          className="toggle-button"
          type="button"
        >
          Back to Course List
        </button>
      )}
    </div>
  );
}
