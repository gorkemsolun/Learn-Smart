import { UploadChoiceModalParameters } from "@/app/types";
import { backendAPI } from "@/environment/backend_api";
import React, { useState } from "react";
import { FaFilePdf, FaRegImages } from "react-icons/fa6";

export default function UploadChoiceModal({
  isOpen,
  onClose,
  selectedChat,
  token,
  onChatUpdated,
  onUploadFile,
  setFile,
  setSlidesMode,
}: UploadChoiceModalParameters) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<"slides" | "file">("slides");

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files && event.target.files[0];
    if (file) {
      setSelectedFile(file);
    } else {
      setSelectedFile(null);
      setFile(null);
    }
  };

  const handleUpload = async () => {
    if (
      !selectedFile ||
      !selectedChat.chat_title.trim() ||
      !selectedChat.chat_id
    )
      return;

    const formData = new FormData();
    formData.append(fileType, selectedFile);

    backendAPI
      .put(`/chat/${selectedChat.chat_id}/update_slides`, formData, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      })
      .then((response) => {

        const updatedChat = response.data;
        onChatUpdated(updatedChat);
        setSelectedFile(null);
        setFile(null);
        onClose();
      })
      .catch((error) => {
        console.error("Error updating chat slides: ", error);
      });
  };

  const handleSubmit = () => {
    if (fileType === "slides") {
      handleUpload();
      setSlidesMode(true);
    } else {
      if (selectedFile) {
        onUploadFile(selectedFile);
      }
      onClose();
      setSelectedFile(null);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setFile(null);
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-gray-900 bg-opacity-75">
      <div className="bg-white p-8 md:p-12 rounded-lg shadow-xl w-1/2">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-semibold text-gray-900">Upload File</h1>
          <button
            className="text-gray-600 hover:text-gray-800 focus:outline-none"
            onClick={handleClose}
            type="button"
            title="Close Modal"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <hr className="mb-4 border-gray-200 w-full" />
        <div className="flex space-x-4 mb-4 items-start">
          <div className="flex flex-col items-center justify-center w-1/2">
            <h2 className="text-xl font-semibold text-gray-900">
              Slide Chat Mode
            </h2>
            <label
              htmlFor="slides-upload"
              className="flex flex-col items-center justify-center w-full h-full p-4 border-2 border-dashed border-gray-400 rounded-lg cursor-pointer hover:border-gray-500 hover:bg-gray-100"
            >
              <FaFilePdf className="w-12 h-12 mb-2 text-gray-500" />
              <p className="text-lg font-semibold text-gray-700">
                Upload Slides
              </p>
              <p className="text-gray-500">PDF, PPTX</p>
              <input
                type="file"
                id="slides-upload"
                className="hidden"
                accept=".pdf, .pptx"
                onChange={handleFileChange}
                onClick={() => setFileType("slides")}
              />
            </label>
          </div>
          <div className="flex flex-col items-center justify-center w-1/2">
            <h2 className="text-xl font-semibold text-gray-900">
              Upload Images/Documents
            </h2>
            <label
                htmlFor="file-upload"
                className="flex flex-col items-center justify-center w-full h-full p-4 border-2 border-dashed border-gray-400 rounded-lg cursor-pointer hover:border-gray-500 hover:bg-gray-100"
            >
              <FaRegImages className="w-12 h-12 mb-2 text-gray-500"/>
              <p className="text-lg font-semibold text-gray-700">Upload File</p>
              <p className="text-gray-500">Images and Documents</p>
              <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  accept="image/*,.doc,.docx,.pdf"
                  onChange={handleFileChange}
                onClick={() => setFileType("file")}
              />
            </label>
          </div>
        </div>
        {selectedFile && (
            <div className="mt-4">
              <button
                  onClick={handleSubmit}
                  className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800"
                  type="button"
              >
                Upload Selected {fileType === "slides" ? "Slides" : "File"}
              </button>
            </div>
        )}
      </div>
    </div>
  );
}
