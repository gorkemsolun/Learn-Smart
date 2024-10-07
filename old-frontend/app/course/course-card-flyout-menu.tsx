import { backendAPI } from "@/environment/backend_api";
import Cookies from "js-cookie";
import { useState } from "react";
import { CiEdit } from "react-icons/ci";
import { FaTrashAlt } from "react-icons/fa";
import ConfirmationModal from "../components/modals/confirmation-modal";
import EditCourseModal from "../components/modals/edit-course-modal";
import { printDebugMessage } from "../debugger";
import { CourseCardFlyoutMenuParameters } from "../types";

export default function CourseCardFlyoutMenu({
  isOpen,
  course,
}: CourseCardFlyoutMenuParameters) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const token = Cookies.get("authToken") || "";

  const handleDeleteCourse = async () => {
    try {
      printDebugMessage("Deleting course", course.course_id);

      const response = await backendAPI.delete(`/course/${course.course_id}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      printDebugMessage("Course deleted successfully", response);

      setIsDeleteModalOpen(false);
      window.location.reload(); // TODO: Replace with a more efficient way to update the UI
    } catch (error) {
      console.error("Error deleting course:", error);
    }
  };

  if (!isOpen)
      return null;

  return (
    <div className="relative z-20">
      {isOpen && (
        <div className="absolute left-0 w-36">
          <div className="rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 overflow-hidden bg-gray-200">
            <div className="flex flex-col gap-2 p-2">
              <button
                onClick={()  => setIsEditModalOpen(true)}
                className="flex items-center text-sm font-normal text-black hover:bg-gray-300 py-2 px-4 rounded-lg transition duration-150 ease-in-out"
              >
                <CiEdit className="mr-2 text-black" />
                Edit
              </button>
              <button
                onClick={() => setIsDeleteModalOpen(true)}
                className="flex items-center text-sm font-normal text-red-500 hover:bg-gray-300 py-2 px-4 rounded-lg transition duration-150 ease-in-out"
              >
                <FaTrashAlt className="mr-2 text-red-500" />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      <ConfirmationModal
            isOpen={isDeleteModalOpen}
            message="Are you sure you want to delete this course?"
            onConfirm={handleDeleteCourse}
            onCancel={() => setIsDeleteModalOpen(false)}
      />
      <EditCourseModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onCourseUpdate={() => {
            setIsEditModalOpen(false);
          }}
          courseId={course.course_id}
      />
    </div>
  );
}
