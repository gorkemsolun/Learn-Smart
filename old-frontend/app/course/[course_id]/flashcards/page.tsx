"use client";

import Navbar from "@/app/components/navbar/navbar";
import { backendAPI } from "@/environment/backend_api";
import Cookies from "js-cookie";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import "../../../style/bg-animation.css";

interface Chat {
  chat_id: number;
  chat_title: string;
  created_at: string;
}

interface FlashcardContent {
  flashcards: string[];
  explanations: string[];
}

interface Flashcard {
  filename: string;
  content: FlashcardContent;
}

export default function Flashcards() {
  const [token, setToken] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);
  const [flashcardsList, setFlashcardsList] = useState<{
    [key: number]: Flashcard[];
  }>({});
  const params = useParams<{ course_id: string }>();
  const course_id = params.course_id;
  const router = useRouter();

  useEffect(() => {
    setToken(Cookies.get("authToken") || "");
  }, []);

  useEffect(() => {
    if (token) {
      fetchAllChats();
    }
  }, [token]);

  const fetchAllChats = async () => {
    if (!token || course_id == null || course_id === "") {
      return;
    }

    setLoading(true);

    try {
      const response = await backendAPI.get(`/course/${course_id}/chats`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      setChats(response.data);

      for (const chat of response.data) {
        await fetchFlashcardsList(chat.chat_id);
      }
    } catch (error) {
      console.error("Error fetching chats:", error);
    } finally {
      console.log(flashcardsList);
      setLoading(false);
    }
  };

  const fetchFlashcardsList = async (chat_id: number) => {
    try {
      const response = await backendAPI.get(`/chat/${chat_id}/flashcards`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      setFlashcardsList((prev) => ({
        ...prev,
        [chat_id]: response.data,
      }));
    } catch (error) {
      console.error("Error fetching flashcards data:", error);
    }
  };

  const handleRename = async (chat_id: number, index: number) => {
    setLoading(true);
    const currentFilename = flashcardsList[chat_id][index].filename;
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
        await backendAPI.put(
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
        console.error("Error renaming flashcard:", error);
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  };

  const handleDelete = async (chat_id: number, index: number) => {
    if (window.confirm("Are you sure you want to delete this flashcard?")) {
      setLoading(true);
      const currentFilename = flashcardsList[chat_id][index].filename;
      const currentFilenameWithoutExtension = currentFilename.replace(
        ".json",
        ""
      );
      try {
        await backendAPI.delete(
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
        console.error("Error deleting flashcard:", error);
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  };

  const handleFilenameClick = async (chat_id: number, filename: string) => {
    try {
      const currentFilenameWithoutExtension = filename.replace(".json", "");
      const response = await backendAPI.get(
        `/chat/${chat_id}/flashcards/${currentFilenameWithoutExtension}`,
        {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = JSON.stringify(response.data.content);
      const url = `/flashcards?data=${encodeURIComponent(data)}`;
      router.push(url);
    } catch (error) {
      console.log(error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <main className="bg-transparent min-h-screen text-black">
      <Navbar />
      <div className="flex-1 flex items-center justify-center bg-transparent text-black p-4">
        <div className="flex flex-col w-full max-w-4xl p-4 bg-white shadow-lg rounded-lg">
          {chats.map((chat) => (
            <div
              key={chat.chat_id}
              className="p-4 mb-4 border rounded-lg shadow-sm bg-gray-50"
            >
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                {chat.chat_title}
              </h3>
              {/* 
              <p className="text-gray-600 mb-1">ID: {chat.chat_id}</p>
              <p className="text-gray-500 text-sm">{chat.created_at}</p>
              */}

              <div className="border-t-4 border-gray-500 mt-4 pt-4 border-dashed">
                {flashcardsList[chat.chat_id] &&
                flashcardsList[chat.chat_id].length > 0 ? (
                  <ul className="space-y-2">
                    {flashcardsList[chat.chat_id].map((flashcard, index) => (
                      <li
                        key={index}
                        className="p-4 border border-gray-300 rounded-lg shadow-sm hover:bg-gray-100 flex items-center justify-between"
                      >
                        <button
                          onClick={() =>
                            handleFilenameClick(
                              chat.chat_id,
                              flashcard.filename
                            )
                          }
                          className="text-lg font-semibold text-blue-500 hover:underline"
                        >
                          {flashcard.filename.replace(".json", "")}
                        </button>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleRename(chat.chat_id, index)}
                            className="bg-yellow-500 text-white py-1 px-2 rounded hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-50"
                          >
                            Rename
                          </button>
                          <button
                            onClick={() => handleDelete(chat.chat_id, index)}
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
          ))}
        </div>
      </div>
    </main>
  );
}
