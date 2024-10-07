"use client";

import { printDebugMessage } from "@/app/debugger";
import { CreateChatModalParameters } from "@/app/types";
import { backendAPI } from "@/environment/backend_api";
import { useParams } from "next/navigation";
import { useState } from "react";
import { FaFilePdf } from "react-icons/fa";

export default function CreateChatModal(
  modalParameters: CreateChatModalParameters
) {
  if (!modalParameters.isOpen) {
    return null;
  }

  const params = useParams<{ course_id: string }>();
  const course_id = params.course_id;
  const [file, setFile] = useState<File | null>(null);
  const [chat_title, setChat_title] = useState<string>("");

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
    }
  };

  const handleCreateChat = async () => {
    if (!chat_title.trim()) return;

    if (file) {
      const formData = new FormData();
      formData.append("slides", file);

      try {
        const response = await backendAPI.post(
          `/chat/create?course_id=${course_id}&chat_title=${chat_title}`,
          formData,
          {
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${modalParameters.authToken}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );

        printDebugMessage("chat create response" + response);

        const newChat = response.data.chat;
        modalParameters.onChatCreated(newChat);
        modalParameters.closeModal();
      } catch (error) {
        console.error("Error creating chat:", error);
      }
    } else {
      try {
        const response = await backendAPI.post(
          `/chat/create?course_id=${course_id}&chat_title=${chat_title}`,
          {
            chat_title: chat_title,
            course_id: course_id,
          },
          {
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${modalParameters.authToken}`,
              "Content-Type": "application/json",
            },
          }
        );

        printDebugMessage("chat create response" + response);

        const newChat = response.data.chat;
        modalParameters.onChatCreated(newChat);
        modalParameters.closeModal();
      } catch (error) {
        console.error("Error creating chat:", error);
      }
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-gray-900 bg-opacity-75">
      <div className="bg-white p-8 md:p-12 rounded-lg shadow-xl w-1/2">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Create New Chat
          </h2>
          <button
            className="text-gray-600 hover:text-gray-800 focus:outline-none"
            onClick={modalParameters.closeModal}
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
        <div className="mb-4">
          <label
            htmlFor="chatTitle"
            className="block text-sm font-medium text-gray-700"
          >
            Chat Title
          </label>
          <input
            type="text"
            id="chatTitle"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Enter chat title"
            value={chat_title}
            onChange={(event) => setChat_title(event.target.value)}
          />
        </div>
        <label
          htmlFor="chatTitle"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Upload Slides (Optional)
        </label>
        <div
          className="mb-4 p-4 border-2 border-dashed rounded relative flex flex-col items-center cursor-pointer"
          onClick={() => document.getElementById("slides-upload")?.click()}
        >
          <FaFilePdf className="w-12 h-12 mb-2 text-gray-500" />
          <p className="text-gray-500">PDF, PPTX ONLY</p>
          <input
            type="file"
            id="slides-upload"
            className="hidden"
            accept=".pdf, .pptx"
            onChange={handleFileChange}
            title="Upload Slides"
          />
        </div>
        <div className="flex justify-center mt-4">
          <button
            type="button"
            className="bg-black hover:bg-gray-800 text-white font-semibold py-2 px-4 rounded-lg mr-2"
            onClick={modalParameters.closeModal}
          >
            Cancel
          </button>
          <button
            type="button"
            className={`bg-black hover:bg-gray-900 text-white font-semibold py-2 px-4 rounded-lg ${
              !chat_title.trim() ? "opacity-80 cursor-not-allowed" : ""
            }`}
            onClick={handleCreateChat}
            disabled={!chat_title.trim()}
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
