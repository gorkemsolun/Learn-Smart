import { documentMimeTypes } from "@/app/constants";
import { backendAPI } from "@/environment/backend_api";
import Cookies from "js-cookie";
import { useEffect, useRef, useState } from "react";
import { FaFilePdf } from "react-icons/fa";
import { TbFileTypeDocx } from "react-icons/tb";

interface UpdateUploadSyllabusParameters {
  isOpen: boolean;
  modalTitle: string;
  onClose: () => void;
  course_id: string;
}

export default function UpdateUploadSyllabus({
  isOpen,
  modalTitle,
  onClose,
  course_id,
}: UpdateUploadSyllabusParameters) {
  const [syllabus, setSyllabus] = useState<File | null>(null);
  const [syllabusError, setSyllabusError] = useState<string>("");
  const [token, setToken] = useState<string>("");
  const [lockSubmit, setLockSubmit] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const resetFields = () => {
    setSyllabus(null);
    setSyllabusError("");
  };

  useEffect(() => {
    setToken(Cookies.get("authToken") || "");
  }, []);

  function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>,
    fileType: string
  ) {
    const file = event.target.files?.[0] || null;
    handleFile(file, fileType);
  }

  function handleFile(file: File | null, fileType: string) {
    if (file) {
      const isValidFileType =
        fileType === "document" && documentMimeTypes.includes(file.type);

      if (!isValidFileType) {
        setSyllabus(null);
        setSyllabusError("Invalid file type. Allowed types are: PDF, DOCX");
        return;
      }

      setSyllabus(file);
      setSyllabusError("");
    } else {
      setSyllabus(null);
      setSyllabusError(
        fileType === "document"
          ? "Invalid file type. Allowed types are: PDF, DOCX"
          : "Invalid file type. Allowed types are: JPG, JPEG, PNG"
      );
    }
  }

  async function handleSubmit(
    event:
      | React.FormEvent<HTMLFormElement>
      | React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) {
    event.preventDefault();

    if (!syllabus) {
      setSyllabusError("Please upload a syllabus file.");
      return;
    }

    const formData = new FormData();
    formData.append("course_syllabus_file", syllabus);
    formData.append("course_update_syllabus", "true");

    setLockSubmit(true);
    try {
      await backendAPI.put(`/course/${course_id}`, formData, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
    } catch (error) {
      setSyllabusError(`An unexpected error occurred. Please try again.`);
    } finally {
      setLockSubmit(false);
      resetFields();
      onClose();
    }
  }

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="w-full max-w-lg rounded-lg bg-black p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            {modalTitle}
          </h2>
          <button
            onClick={onClose}
            type="button"
            className="text-2xl text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
          >
            &times;
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div
            className="bg-gray-250 flex h-48 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-600 hover:bg-gray-300 dark:border-gray-900 dark:bg-gray-800 dark:hover:bg-gray-900"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files[0];
              handleFile(file, "document");
            }}
          >
            <div className="flex flex-col items-center justify-center pb-6 pt-5">
              {syllabus ? (
                <div>
                  {syllabus.name.endsWith(".pdf") && (
                    <FaFilePdf className="mb-4 size-16 text-gray-700 dark:text-gray-500" />
                  )}
                  {syllabus.name.endsWith(".docx") && (
                    <TbFileTypeDocx className="mb-4 size-16 text-gray-700 dark:text-gray-300" />
                  )}
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {syllabus.name}
                  </p>
                </div>
              ) : (
                <div>
                  <svg
                    className="mb-4 size-8 text-gray-500 dark:text-gray-400"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 20 16"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                    />
                  </svg>
                  <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-semibold">Click to upload</span> or
                    drag and drop
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    PDF or DOCX
                  </p>
                </div>
              )}
            </div>
            <input
              id="syllabus"
              type="file"
              accept=".pdf,.docx"
              onChange={(event) => handleFileChange(event, "document")}
              ref={fileInputRef}
              className="hidden"
              title="Upload syllabus"
            />
          </div>

          {syllabusError && (
            <p className="mt-2 text-center text-sm text-red-500">
              {syllabusError}
            </p>
          )}

          <p className="mt-2 text-center text-sm text-gray-400 dark:text-gray-500">
            You can upload your course syllabus to get a personalized weekly
            study plan.
          </p>

          <div className="mt-6 flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-gray-400 px-4 py-2 text-black transition duration-300 hover:bg-gray-500 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={syllabus === null || lockSubmit}
              className={`rounded-lg px-4 py-2 transition duration-300 ${
                syllabus === null || lockSubmit
                  ? "cursor-not-allowed bg-gray-500 text-gray-300 opacity-60 dark:bg-gray-700 dark:text-gray-500"
                  : "bg-gray-900 text-white hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600"
              }`}
            >
              Upload
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
