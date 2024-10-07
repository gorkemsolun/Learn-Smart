"use client";

import "@/app/style/course-homepage.css";
import { backendAPI } from "@/environment/backend_api";
import Cookies from "js-cookie";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface FlashcardContent {
  flashcards: string[];
  explanations: string[];
}

interface Flashcard {
  filename: string;
  content: FlashcardContent;
}

export default function FlashCardList() {
  const [token, setToken] = useState<string>("");
  const [flashcardsList, setFlashcardsList] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const params = useParams<{ chat_id: string }>();
  const chat_id = params.chat_id;
  const router = useRouter();

  useEffect(() => {
    setToken(Cookies.get("authToken") || "");
  }, []);

  useEffect(() => {
    if (token) {
      fetchFlashcardsList(chat_id);
    }
  }, [token, chat_id]);

  const fetchFlashcardsList = async (chat_id: string) => {
    try {
      setLoading(true);
      const response = await backendAPI.get(`chat/${chat_id}/flashcards`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      setFlashcardsList(response.data); // Store data in state
    } catch (error) {
      console.error("Error fetching flashcards data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  if (loading) return <p>Loading...</p>; // Show loading state

  const handleRename = async (index: number) => {
    setLoading(true);
    const currentFilename = flashcardsList[index].filename;
    const currentFilenameWithoutExtension = currentFilename.replace(
      ".json",
      ""
    );
    const newFilename = prompt(
      "Enter new filename:",
      currentFilenameWithoutExtension
    );
    if (newFilename) {
      try {
        const response = await backendAPI.put(
          `chat/${chat_id}/flashcards/${currentFilenameWithoutExtension}`,
          { new_name: newFilename },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        window.location.reload();
      } catch (error) {
        console.error("Error fetching flashcards data:", error);
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  };

  const handleDelete = async (index: number) => {
    if (window.confirm("Are you sure you want to delete this flashcard?")) {
      setLoading(true);
      const currentFilename = flashcardsList[index].filename;
      const currentFilenameWithoutExtension = currentFilename.replace(
        ".json",
        ""
      );
      if (currentFilenameWithoutExtension) {
        try {
          const response = await backendAPI.delete(
            `chat/${chat_id}/flashcards/${currentFilenameWithoutExtension}`,
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            }
          );
          window.location.reload();
        } catch (error) {
          console.error("Error deleting flashcards data:", error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    }
  };
  return (
    <div className="p-4 space-y-4">
      <button
        onClick={handleBack}
        className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
      >
        Back
      </button>
      <div className="border-t-4 border-blue-500 mt-4 pt-4 border-dashed">
        {flashcardsList.length > 0 ? (
          <ul className="space-y-2">
            {flashcardsList.map((flashcard, index) => (
              <li
                key={index}
                className="p-4 border border-gray-300 rounded-lg shadow-sm hover:bg-gray-100 flex items-center justify-between"
              >
                <h3 className="text-lg font-semibold">{flashcard.filename}</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleRename(index)}
                    className="bg-yellow-500 text-white py-1 px-2 rounded hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-50"
                  >
                    Rename
                  </button>
                  <button
                    onClick={() => handleDelete(index)}
                    className="bg-red-500 text-white py-1 px-2 rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No flashcards found.</p>
        )}
      </div>
    </div>
  );
}

{
  /*
              {flashcard.content.flashcards.map((flashcardTopic, idx) => (
                <div key={idx}>
                  <h4>{flashcardTopic}</h4>
                  <p>{flashcard.content.explanations[idx]}</p>
                </div>
              ))}
            */
}
