import { documentMimeTypes } from "@/app/constants";
import { printDebugMessage } from "@/app/debugger";
import { UpdateUploadSyllabusParameters } from "@/app/types";
import { backendAPI } from "@/environment/backend_api";
import Cookies from "js-cookie";
import { useEffect, useRef, useState } from "react";
import { FaFilePdf } from "react-icons/fa";
import { TbFileTypeDocx } from "react-icons/tb";

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
      printDebugMessage(`Selected file: ${file.name}`);
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
      const response = await backendAPI.put(`/course/${course_id}`, formData, {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">{modalTitle}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 text-2xl"
          >
            &times;
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div
            className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files[0];
              handleFile(file, "document");
            }}
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              {syllabus ? (
                <div>
                  {syllabus.name.endsWith(".pdf") && (
                    <FaFilePdf className="w-16 h-16 mb-4" />
                  )}
                  {syllabus.name.endsWith(".docx") && (
                    <TbFileTypeDocx className="w-16 h-16 mb-4" />
                  )}
                  <p className="text-sm text-gray-500">{syllabus.name}</p>
                </div>
              ) : (
                <div>
                  <svg
                    className="w-8 h-8 mb-4 text-gray-500"
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
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Click to upload</span> or
                    drag and drop
                  </p>
                  <p className="text-xs text-gray-500">PDF or DOCX</p>
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
            <p className="text-sm text-red-500 mt-2 text-center">
              {syllabusError}
            </p>
          )}
          <p className="text-sm text-gray-400 mt-2 text-center">
            You can upload your course syllabus to get a personalized weekly
            study plan.
          </p>
          <div className="mt-6 flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400 transition duration-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={syllabus === null || lockSubmit}
              className={`px-4 py-2 rounded-lg transition duration-300 ${
                syllabus === null || lockSubmit
                  ? "bg-black text-white cursor-not-allowed opacity-60"
                  : "bg-gray-800 text-white hover:bg-gray-900"
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
