"use client";

import ChatFieldMenu from "@/app/components/chat-field-menu";
import ChatsList from "@/app/components/chats-list";
import LoadingMessage from "@/app/components/loading-message";
import CreateChatModal from "@/app/components/modals/create-chat-modal";
import { printDebugMessage } from "@/app/debugger";
import "@/app/style/logo-font.css";
import { Chat, Course, Message } from "@/app/types";
import logo from "@/assets/chatbot-logo.png";
import { backend, backendAPI } from "@/environment/backend_api";
import Cookies from "js-cookie";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { FaArrowCircleRight, FaCalendarAlt } from "react-icons/fa";
import { GiBookmarklet, GiSpellBook } from "react-icons/gi";
import { BsFileEarmarkPdf } from "react-icons/bs";
import { ImSpinner8 } from "react-icons/im";
import ReactMarkdown from "react-markdown";

export default function InstructorPage() {
  const [open, setOpen] = useState<boolean>(true);
  const [token, setToken] = useState<string>("");
  const [course, setCourse] = useState<Course>({} as Course);
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat>({} as Chat);
  const [messages, setMessages] = useState<Message[]>([]);
  const [lastMessageID, setLastMessageID] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFetching, setIsFetching] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const router = useRouter();
  const [slidesMode, setSlidesMode] = useState<boolean>(false);
  const params = useParams<{ course_id: string }>();
  const course_id = params.course_id;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  if (token == null) {
    router.replace("/login");
  }

  function removeChatFromChatList(chat_id: string) {
    setChats(chats.filter((chat) => chat.chat_id !== chat_id));
  }

  const fetchChat = async (chat_id: string) => {
    if (!token || chat_id == null || chat_id === "" || chat_id === undefined) {
      return;
    }

    await backendAPI
      .get(`/chat/${chat_id}`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => {
        setSlidesMode(response.data.slides_mode);
      })
      .catch((error) => {
        console.error(error);
        throw error;
      });
  };

  const fetchAllChats = async () => {
    if (!token || course_id == null || course_id === "") {
      return;
    }

    backendAPI
      .get(`/course/${course_id}/chats`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => {
        setChats(response.data);

        printDebugMessage("Chats: " + JSON.stringify(response.data));
      })
      .catch((error) => {
        console.error("Error fetching chats:", error);
      });
  };

  const fetchCourse = () => {
    if (!token || course_id == null || course_id === "") {
      return;
    }

    backendAPI
      .get(`/course/${course_id}`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => {
        setCourse(response.data);

        printDebugMessage("Course: " + JSON.stringify(response.data));
      })
      .catch((error) => {
        console.error("Error fetching course:", error);
      });
  };

  const fetchChatMessages = (chat_id: string) => {
    if (!token || chat_id == null || chat_id === "") {
      return;
    }

    fetchChat(chat_id);
  };

  const fetchNewSlide = async (chat_id: string) => {
    if (!token || chat_id == null || chat_id === "") {
      return;
    }

    setIsFetching(true);
    backendAPI
      .get(`/chat/${chat_id}/next_slide`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => {
        let text,
          media_url = null;

        printDebugMessage("Response: " + JSON.stringify(response.data));

        if (response.data.details == "no slides") {
          setSlidesMode(false);
        } else if (response.data.details == "success") {
          ({ text, media_url } = response.data);
        }

        if (text !== null && media_url !== null) {
          const modelResponse = {
            text: text,
            role: "model",
            media_url: `${backend.getUri()}/${media_url}`,
            message_id: lastMessageID + 1,
          };

          setMessages((prevMessages: Message[]) => [
            ...prevMessages,
            modelResponse,
          ]);
          setLastMessageID(lastMessageID + 1);

          printDebugMessage("Model Response: " + JSON.stringify(modelResponse));
        } else {
          printDebugMessage("Received null not fetching new slide.");
        }
      })
      .catch((error) => {
        console.error("Error fetching chat messages:", error);
      })
      .finally(() => {
        setIsFetching(false);
      });
  };

  const handleChatSelection = async (chat_id: string) => {
    if (!token || chat_id == null || chat_id === "") {
      return;
    }

    if (chat_id !== selectedChat?.chat_id) {
      await backendAPI
        .get(`/chat/${chat_id}`, {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        })
        .then((response) => {
          printDebugMessage("Chat Data: " + JSON.stringify(response.data));

          const chatMessages = response.data.history.map((msg: Message) => ({
            text: msg.text,
            role: msg.role,
            media_url: msg.media_url
              ? `${backend.getUri()}/${msg.media_url}`
              : null,
            message_id: msg.message_id,
          }));

          setMessages(chatMessages);
          if (response.data.history.length > 0) {
            setLastMessageID(
              response.data.history[response.data.history.length - 1].message_id
            );
          }

          setSlidesMode(response.data.slides_mode);

          printDebugMessage("Messages: " + JSON.stringify(chatMessages));
          printDebugMessage("Last Message ID: " + lastMessageID);
          printDebugMessage("Chat Data: " + JSON.stringify(response.data));
          printDebugMessage("Slides Mode: " + response.data.slides_mode);

          setSelectedChat(response.data);
        })
        .catch((error) => {
          console.error("Error fetching chat messages:", error);
        });
    }
  };

  const handleChatCreated = (newChat: Chat) => {
    if (!newChat) {
      return;
    }

    setChats([...chats, newChat]);
    setSelectedChat(newChat);
    setMessages([]);
    fetchChatMessages(newChat.chat_id);
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    setToken(Cookies.get("authToken") || "");
  }, []);

  useEffect(() => {
    if (token) {
      fetchCourse();
      fetchAllChats();
    }
  }, [token]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <main>
      {Object.keys(course).length ? (
        <div className="flex h-screen">
          <div
            className={`text-gray-400 h-full p-2 pt-8 ${
              open ? "w-60 bg-[#181414]" : "w-20 bg-transparent"
            } duration-200 relative`}
          >
            <div className="flex justify-between items-center mb-5 text-gray-400">
              <button
                  className="h-10 rounded-lg px-2 text-token-text-secondary focus-visible:outline-0
                            hover:bg-token-sidebar-surface-secondary focus-visible:bg-token-sidebar-surface-secondary"
                  onClick={() => setOpen(!open)}
                  title="Toggle Sidebar"
                  type="button"
              >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    fill="none"
                    viewBox="0 0 24 24"
                    className="icon-xl-heavy"
                >
                  <path
                      fill="currentColor"
                      fillRule="evenodd"
                      d="M8.857 3h6.286c1.084 0 1.958 0 2.666.058.729.06 1.369.185 1.961.487a5 5 0 0 1 2.185 2.185c.302.592.428 1.233.487 1.961.058.708.058 1.582.058 2.666v3.286c0 1.084 0 1.958-.058 2.666-.06.729-.185 1.369-.487 1.961a5 5 0 0 1-2.185 2.185c-.592.302-1.232.428-1.961.487C17.1 21 16.227 21 15.143 21H8.857c-1.084 0-1.958 0-2.666-.058-.728-.06-1.369-.185-1.96-.487a5 5 0 0 1-2.186-2.185c-.302-.592-.428-1.232-.487-1.961C1.5 15.6 1.5 14.727 1.5 13.643v-3.286c0-1.084 0-1.958.058-2.666.06-.728.185-1.369.487-1.96A5 5 0 0 1 4.23 3.544c.592-.302 1.233-.428 1.961-.487C6.9 3 7.773 3 8.857 3M6.354 5.051c-.605.05-.953.142-1.216.276a3 3 0 0 0-1.311 1.311c-.134.263-.226.611-.276 1.216-.05.617-.051 1.41-.051 2.546v3.2c0 1.137 0 1.929.051 2.546.05.605.142.953.276 1.216a3 3 0 0 0 1.311 1.311c.263.134.611.226 1.216.276.617.05 1.41.051 2.546.051h.6V5h-.6c-1.137 0-1.929 0-2.546.051M11.5 5v14h3.6c1.137 0 1.929 0 2.546-.051.605-.05.953-.142 1.216-.276a3 3 0 0 0 1.311-1.311c.134-.263.226-.611.276-1.216.05-.617.051-1.41.051-2.546v-3.2c0-1.137 0-1.929-.051-2.546-.05-.605-.142-.953-.276-1.216a3 3 0 0 0-1.311-1.311c-.263-.134-.611-.226-1.216-.276C17.029 5.001 16.236 5 15.1 5zM5 8.5a1 1 0 0 1 1-1h1a1 1 0 1 1 0 2H6a1 1 0 0 1-1-1M5 12a1 1 0 0 1 1-1h1a1 1 0 1 1 0 2H6a1 1 0 0 1-1-1"
                    clipRule="evenodd"
                  ></path>
                </svg>
              </button>
              <button
                className="h-10 rounded-lg px-2 text-token-text-secondary focus-visible:outline-0 
                            hover:bg-token-sidebar-surface-secondary focus-visible:bg-token-sidebar-surface-secondary"
                onClick={() => setIsModalOpen(true)}
                title="Create Chat"
                type="button"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  className="icon-xl-heavy"
                >
                  <path d="M15.673 3.913a3.121 3.121 0 1 1 4.414 4.414l-5.937 5.937a5 5 0 0 1-2.828 1.415l-2.18.31a1 1 0 0 1-1.132-1.13l.311-2.18A5 5 0 0 1 9.736 9.85zm3 1.414a1.12 1.12 0 0 0-1.586 0l-5.937 5.937a3 3 0 0 0-.849 1.697l-.123.86.86-.122a3 3 0 0 0 1.698-.849l5.937-5.937a1.12 1.12 0 0 0 0-1.586M11 4A1 1 0 0 1 10 5c-.998 0-1.702.008-2.253.06-.54.052-.862.141-1.109.267a3 3 0 0 0-1.311 1.311c-.134.263-.226.611-.276 1.216C5.001 8.471 5 9.264 5 10.4v3.2c0 1.137 0 1.929.051 2.546.05.605.142.953.276 1.216a3 3 0 0 0 1.311 1.311c.263.134.611.226 1.216.276.617.05 1.41.051 2.546.051h3.2c1.137 0 1.929 0 2.546-.051.605-.05.953-.142 1.216-.276a3 3 0 0 0 1.311-1.311c.126-.247.215-.569.266-1.108.053-.552.06-1.256.06-2.255a1 1 0 1 1 2 .002c0 .978-.006 1.78-.069 2.442-.064.673-.192 1.27-.475 1.827a5 5 0 0 1-2.185 2.185c-.592.302-1.232.428-1.961.487C15.6 21 14.727 21 13.643 21h-3.286c-1.084 0-1.958 0-2.666-.058-.728-.06-1.369-.185-1.96-.487a5 5 0 0 1-2.186-2.185c-.302-.592-.428-1.233-.487-1.961C3 15.6 3 14.727 3 13.643v-3.286c0-1.084 0-1.958.058-2.666.06-.729.185-1.369.487-1.961A5 5 0 0 1 5.73 3.545c.556-.284 1.154-.411 1.827-.475C8.22 3.007 9.021 3 10 3A1 1 0 0 1 11 4"></path>
                </svg>
              </button>
            </div>

            {open && (
                <div className="flex-grow flex flex-col relative h-5/6">
                  <div className="inline-flex items-center mb-12">
                    <Image
                        className="rounded-full mr-3"
                        src={logo}
                        alt="logo"
                        width={40}
                        height={40}
                    />
                    <h1 className="origin-left font-medium text-lg">
                      {course?.course_name || "Loading..."}
                    </h1>
                  </div>
                  <ChatsList
                      chats={chats}
                      selectedChat={selectedChat}
                      handleChatSelection={handleChatSelection}
                      removeChatFromChatList={removeChatFromChatList}
                      setChats={setChats}
                      setSelectedChat={setSelectedChat}
                  />
                </div>
            )}
          </div>
          <div className="p-10 flex-grow flex flex-col relative bg-transparent">
            {Object.keys(selectedChat).length ? (
                <div className="flex flex-col h-full">
                  <div className="flex justify-between items-center mb-4">
                    <h1 className="text-2xl font-semibold">
                      {selectedChat.chat_title}
                    </h1>
                    {slidesMode && (
                        <button
                            className={`bg-transparent text-4xl p-2 text-black  ${
                                isFetching ? "cursor-not-allowed" : "cursor-pointer"
                            }`}
                            onClick={() =>
                                !isFetching && fetchNewSlide(selectedChat?.chat_id)
                            }
                            type="button"
                            disabled={isFetching}
                        >
                          {isFetching ? (
                              <ImSpinner8 className="animate-spin" />
                      ) : (
                        <FaArrowCircleRight />
                      )}
                    </button>
                  )}
                </div>
                <div
                  ref={chatContainerRef}
                  className="flex-grow mt-5 overflow-y-auto"
                >
                  {messages.map((message) => (
                    <div
                      key={message.message_id}
                      className={`flex ${
                        message.role === "user"
                          ? "justify-end"
                          : "justify-start"
                      } mb-2`}
                    >
                      {message.text || message.media_url ? (
                        <div
                          className={`p-4 ${
                            message.role === "user"
                              ? "bg-blue-500 text-white"
                              : "bg-gray-300 text-black"
                          } max-w-5xl rounded-lg`}
                        >
                          {message.media_url && (
                            <div className="flex justify-center mb-2">
                              {/\.(pdf|docx|pptx)$/.test(message.media_url.toLowerCase()) ? (
                                <BsFileEarmarkPdf className="text-8xl" />
                              ) : (
                                <img
                                  src={message.media_url}
                                  alt="Uploaded media"
                                  className="max-w-full h-auto rounded-lg"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.nextSibling.style.display = 'block';
                                  }}
                                />
                              )}
                              <BsFileEarmarkPdf
                                className="text-8xl"
                                style={{ display: 'none' }}
                              />
                            </div>
                          )}

                          {message.text && (
                            <div>
                              {message.role === "model" ? (
                                <ReactMarkdown>{message.text}</ReactMarkdown>
                              ) : (
                                <div>{message.text}</div>
                              )}
                            </div>
                          )}
                        </div>
                      ) : null}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {isLoading && <LoadingMessage />}
                <ChatFieldMenu
                  selectedChat={selectedChat}
                  token={token}
                  setMessages={setMessages}
                  setLastMessageID={setLastMessageID}
                  lastMessageID={lastMessageID}
                  setIsLoading={setIsLoading}
                  setSlidesMode={setSlidesMode}
                />
              </div>
            ) : (
              // TO-DO WRITE LINKS HERE IT WON'T HAVE THE SAME LINKS AS BEFORE WE NEED TO PASS ARGUMENTS
              <div className="text-center mt-40">
                <button
                    onClick={() => {
                      router.replace(`/home-page`);
                    }}>
                  <div className="inline-flex gap-0">
                    <h1
                        className="text-6xl font-bold"
                        style={{
                          fontFamily: "logo-font, serif",
                          color: "rgb(23,144, 288)",
                          letterSpacing: "0.025em",
                        }}
                    >
                      learn
                    </h1>
                    <h1
                        className="text-6xl font-bold"
                        style={{
                          fontFamily: "logo-font, serif",
                          color: "black",
                          letterSpacing: "0.025em",
                        }}
                    >
                      smart
                    </h1>
                  </div>
                </button>
                <div className="mx-3 mt-12 flex flex-col items-center justify-center gap-4">
                  <div className="flex flex-wrap items-center justify-center gap-4">
                    <button
                        className="relative flex w-40 flex-col gap-2 rounded-2xl border border-token-border-light
                    px-3 pb-4 pt-3 text-start align-top text-[15px] shadow-xxs transition enabled:hover:bg-token-main-surface-secondary
                    disabled:cursor-not-allowed bg-gray-300 hover:bg-gray-400"
                        type="button"
                        onClick={() => {
                          router.replace(`/course/${course_id}/quizzes`);
                        }}
                    >
                      <GiSpellBook
                        className="text-2xl"
                        style={{ color: "rgb(44, 84, 102)" }}
                      />
                      <div className="line-clamp-3 max-w-full text-balance text-gray-600 dark:text-gray-500 break-word">
                        Go to Quiz for {course?.course_name || "the Course"}
                      </div>
                    </button>
                    <button
                      className="relative flex w-40 flex-col gap-2 rounded-2xl border border-token-border-light
                    px-3 pb-4 pt-3 text-start align-top text-[15px] shadow-xxs transition enabled:hover:bg-token-main-surface-secondary
                    disabled:cursor-not-allowed bg-gray-300 hover:bg-gray-400"
                      type="button"
                      onClick={()=>{
                        router.replace(`/course/${course_id}/flashcards`);
                      }}
                    >
                      <GiBookmarklet
                        className="text-2xl"
                        style={{ color: "rgb(118, 208, 235)" }}
                      />
                      <div className="line-clamp-3 max-w-full text-balance text-gray-600 dark:text-gray-500 break-word">
                        Flashcard for {course?.course_name || "the Course"}
                      </div>
                    </button>
                    <button
                      className="relative flex w-40 flex-col gap-2 rounded-2xl border border-token-border-light
                    px-3 pb-4 pt-3 text-start align-top text-[15px] shadow-xxs transition enabled:hover:bg-token-main-surface-secondary
                    disabled:cursor-not-allowed bg-gray-300 hover:bg-gray-400"
                      type="button"
                      onClick={()=>{
                        router.replace(`/course/${course_id}/weekly-study-plan`);
                      }}
                    >
                      <FaCalendarAlt
                        className="text-2xl"
                        style={{ color: "rgb(203, 139, 208)" }}
                      />
                      <div className="line-clamp-3 max-w-full text-balance text-gray-600 dark:text-gray-500 break-word">
                        Weekly Study Plan of{" "}
                        {course?.course_name || "the Course"}
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-transparent min-h-screen text-black">
          <p>Loading...</p>
        </div>
      )}
      <CreateChatModal
        isOpen={isModalOpen}
        closeModal={() => setIsModalOpen(false)}
        authToken={token}
        onChatCreated={handleChatCreated}
      />
    </main>
  );
}
