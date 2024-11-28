"use client"
import { useParams, useRouter } from "next/navigation";
import React, { useState, useEffect, useRef } from 'react'
import Cookies from "js-cookie";
import { Button } from "@/components/ui/button"
import { Menu, ArrowLeft, ArrowRight } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { Course, Chat, Slide, Message } from '@/app/types'
import { backend, backendAPI } from '@/environment/backend_api'
import ChatInterface from "@/components/chat-interface";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { 
  Select, 
  SelectTrigger, 
  SelectValue, 
  SelectContent, 
  SelectItem 
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { CreateChatSheet } from "./create-chat-sheet";
import { Sidebar } from "./sidebar";

export default function InstructorPage() {
  const router = useRouter();
  const [token, setToken] = useState<string>("");

  const params = useParams<{ course_id: string }>();
  const courseID = params.course_id;

  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Sidebar state
  const [isLoading, setIsLoading] = useState(false); // Loading state for fetching slides and messages
  const [isSheetOpen, setIsSheetOpen] = useState(false); // Create chat sheet state
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false); // Delete chat dialog state

  const [course, setCourse] = useState<Course>({} as Course);
  const [courses, setCourses] = useState<Course[]>([]);
  const [chats, setChats] = useState<{chat_id: string, chat_title: string}[]>([]);

  const [imgSrc, setImgSrc] = useState<string|undefined>(undefined); // Image source for presentation slide
  const [currentSlide, setCurrentSlide] = useState<Slide>({} as Slide); // Current slide info
  const [currentSlidePage, setCurrentSlidePage] = useState(1); // Current page number of the open slide

  const [activeChat, setActiveChat] = useState<Chat>({} as Chat); // Currently open chat
  const [activeMessages, setActiveMessages] = useState<Message[]>([]); // Messages in the active chat
  const [lastMessageID, setLastMessageID] = useState(0); // ID of the last message sent in the active chat

  const [inputMessage, setInputMessage] = useState(''); // Text field input in the chat

  const [presentationFiles, setPresentationFiles] = useState<{slide_id: string, slides_file_name: string}[]>([]); // List of presentation files of the active chat
  const [activeFile, setActiveFile] = useState<{filename: string, slide_id: string}>({ filename: '', slide_id: '' }); // Currently active presentation file

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [chatIDToDelete, setChatIDToDelete] = useState<string>(""); // Chat ID of the chat being deleted

  // Check if user is authenticated
  useEffect(() => {
    const authToken = Cookies.get("authToken");
    if (authToken) {
      setToken(authToken);
    } else {
      setToken("");
      router.replace("/sign-in");
    }
  }, []);
  
  // initialize course and chats
  useEffect(() => {
    if (token) {
      fetchCourse();
      fetchAllCourses();
      fetchAllChats();
    }
  }, [token]);

  // Fetch active chat
  useEffect(() => {
    if (activeChat) {
      const slideID = activeChat.slides_mode ? activeChat.last_opened_slide_id : null;
      if (slideID) {
        setPresentationFiles(activeChat.slides.map(slide => ({
          slide_id: slide.slide_id, slides_file_name: slide.slides_file_name
        })));
        fetchSlideInfo(slideID)
          .then((response) => {
            const slide: Slide = response.data;
            const lastSlideNumber = slide.last_slide_number; // last page seen by user
            
            setActiveFile({ filename: slide.slides_file_name, slide_id: slide.slide_id });
            
            setCurrentSlide(slide);
            setCurrentSlidePage((lastSlideNumber));
            fetchSlide(activeChat.chat_id, slideID, lastSlideNumber)
              .then((response) => {
                const slideBase64 = response.data.slide;
                const history = response.data.history;
                setImgSrc(`data:image/png;base64,${slideBase64}`);
                setActiveMessages(history);
                setLastMessageID(history[history.length - 1].message_id);
              })
              .catch((error) => {
                console.error("Error fetching slide:", error);
              });
          })
          .catch((error) => {
            console.error("Error fetching slide info:", error);
          });
      } else {
        setActiveFile({ filename: '', slide_id: '' });
        setCurrentSlide({} as Slide);
        setCurrentSlidePage(-1);
        setPresentationFiles([]);
        setImgSrc(undefined);

        const chatID = activeChat.chat_id;
        if (chatID) {
          fetchChat(activeChat.chat_id).
          then((response) => {
            const history = response.data.history;
            setActiveMessages(history);
            setLastMessageID(history[history.length - 1].message_id);
          })
          .catch((error) => {
            console.error("Error fetching chat messages:", error);
          });
        }
      }
    }
  }, [activeChat]);

  // Fetch active file's slide info and messages
  useEffect(() => {
    if (activeFile.filename) {
      fetchSlideInfo(activeFile.slide_id)
      .then((response) => {
        const slide: Slide = response.data;
        const lastSlideNumber = slide.last_slide_number; // last page seen by user
        
        setCurrentSlide(slide);
        setCurrentSlidePage((lastSlideNumber));
        fetchSlide(activeChat.chat_id, activeFile.slide_id, lastSlideNumber)
          .then((response) => {
            const slideBase64 = response.data.slide;
            const history = response.data.history;
            setImgSrc(`data:image/png;base64,${slideBase64}`);
            setActiveMessages(history);
            setLastMessageID(history[history.length - 1].message_id);
          })
          .catch((error) => {
            console.error("Error fetching slide:", error);
          });
      })
      .catch((error) => {
        console.error("Error fetching slide info:", error);
      });
    }
  }, [activeFile]);

  // Scroll to bottom of chat messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeMessages]);

  // functions
  const fetchCourse = async () => {
    if (!token || !courseID) {
      return;
    }
    await backendAPI
      .get(`/course/${courseID}`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => {
        setCourse(response.data);
      })
      .catch((error) => {
        console.error("Error fetching course:", error);
      });
  };

  const fetchAllCourses = async () => {
    if (!token) {
      return;
    }
    await backendAPI
      .get(`/users/me`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => {
        setCourses(response.data.courses.map((course: {course_id: string, course_name: string, course_code: string}) => ({
          course_id: course.course_id,
          course_name: course.course_name,
          course_code: course.course_code,
          })
        ));
      })
      .catch((error) => {
        console.error("Error fetching course:", error);
      });
  }

  const fetchAllChats = async () => {
    if (!token || !courseID) {
      return;
    }

    await backendAPI
      .get(`/course/${courseID}/chats`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => {
        setChats(response.data);
      })
      .catch((error) => {
        console.error("Error fetching chats:", error);
      });
  };

  const fetchChat = (chatID: string) => {
    if (!token || !chatID) {
      return Promise.reject(new Error("Invalid parameters"));
    }
  
    return backendAPI.get(`/chat/${chatID}`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
  }

  const fetchSlide = (chatID: string, slideID: string, pageNumber: number) => {
    if (!token || !chatID || !slideID || pageNumber <= 0) {
      console.error("Invalid parameters");
      return Promise.reject(new Error("Invalid parameters"));
    }
  
    return backendAPI.get(`/chat/${chatID}/slide/${slideID}/page/${pageNumber}`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
  };  

  const fetchSlideInfo = (slideID: string) => {
    if (!token || !slideID) {
      return Promise.reject(new Error("Invalid parameters"));
    }
  
    return backendAPI.get(`/chat/slides/${slideID}`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
  }

  const handlePreviousSlide = () => {
    if (!activeChat || !activeChat.last_opened_slide_id) {
      console.error("Invalid active chat or slide ID");
      return;
    }
    setIsLoading(true);
    fetchSlide(activeChat.chat_id, activeChat.last_opened_slide_id, currentSlidePage - 1)
      .then((response) => {
        const slideBase64 = response.data.slide;
        const history = response.data.history;
        setImgSrc(`data:image/png;base64,${slideBase64}`);
        setCurrentSlidePage(currentSlidePage - 1);
        setActiveMessages(history);
        setLastMessageID(history[history.length - 1].message_id);
      })
      .catch((error) => {
        toast({
          title: "Error",
          description: "Failed to fetch previous slide",
          variant: "destructive",
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  };  

  const handleNextSlide = () => {
    if (!activeChat || !activeChat.last_opened_slide_id) {
      console.error("Invalid active chat or slide ID");
      return;
    }
    setIsLoading(true);
    fetchSlide(activeChat.chat_id, activeChat.last_opened_slide_id, currentSlidePage + 1)
      .then((response) => {
        const slideBase64 = response.data.slide;
        const history = response.data.history;
        setImgSrc(`data:image/png;base64,${slideBase64}`);
        setCurrentSlidePage(currentSlidePage + 1);
        setActiveMessages(history);
        setLastMessageID(history[history.length - 1].message_id);
      })
      .catch((error) => {
        toast({
          title: "Error",
          description: "Failed to fetch next slide",
          variant: "destructive",
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  };
  
  const handleChatSelection = async (chatID: string) => {
    if (!token || !chatID) return;
    console.log("Selected chat:", chatID);
    await backendAPI
      .get(`/chat/${chatID}`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => {
        setActiveChat(response.data);
        // rest is handled by useEffect
      })
      .catch((error) => {
        console.error("Error fetching chat:", error);
      });
  }
  
  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const formData = new FormData();
    formData.append("text", inputMessage);

    /* if (file) formData.append("file", file); */

    const newMessage: Message = {
      text: inputMessage,
      role: "user",
      message_id: lastMessageID + 1,
      /* media_url: file ? URL.createObjectURL(file) : null, */
      media_url: null,
    };
    setActiveMessages((messages: Message[]) => [...messages, newMessage]);
    setIsLoading(true);
    setInputMessage("");

    const url = activeChat.slides_mode
    ? `/chat/${activeChat.chat_id}/send_message?slide_id=${currentSlide.slide_id}&page_number=${currentSlidePage}`
    : `/chat/${activeChat.chat_id}/send_message`;

    backendAPI
      .post(url, formData, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      })
      .then((response) => {
        const modelResponse = {
          text: response.data.text,
          role: response.data.role,
          media_url: response.data.media_url
            ? `${backend.getUri()}/${response.data.media_url}`
            : null,
          message_id: lastMessageID + 2,
        };
        setActiveMessages((messages) => [...messages, modelResponse]);
        setLastMessageID(lastMessageID + 2);
      })
      .catch((error) => {
        console.error("Error sending message:", error);
      })
      .finally(() => {
        setIsLoading(false);
      });

  }

  const handleFileChange = (slide_id: string) => {
    const selectedFile = presentationFiles.find(file => file.slide_id === slide_id);
    if (selectedFile) {
      setActiveFile({ filename: selectedFile.slides_file_name, slide_id: selectedFile.slide_id });
    }
    setActiveChat((prevActiveChat) => {
      return {...prevActiveChat, last_opened_slide_id: slide_id};
    })
  }

  const handleNewChat = (newChat: Chat) => {
    if (!newChat) {
      return;
    }
    setChats((prevChats) => [...prevChats, newChat]);
    setActiveChat(newChat);
    setIsSheetOpen(false);
    setActiveMessages([]);
  }

  const handleChatRename = (chatID: string, editedTitle: string) => {
    if (!editedTitle.trim()) return;

    backendAPI
      .put(`/chat/${chatID}`, null, {
        params: { chat_title: editedTitle },
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      })
      .then(() => {
        setChats((prevChats) =>
          prevChats.map((chat) =>
            chat.chat_id === chatID ? { ...chat, chat_title: editedTitle } : chat
          )
        );
      })
      .catch((error) => {
        console.error("Error renaming chat:", error);
      });
  }

  const handleChatAction = (action: string, chatID: string, editedTitle?: string) => {
    switch (action) {
      case "select":
        handleChatSelection(chatID);
        break;
      case "create":
        setIsSheetOpen(true);
        break;
      case "delete":
        setChatIDToDelete(chatID);
        setIsAlertDialogOpen(true);
        break;
      case "rename":
        handleChatRename(chatID, editedTitle || "");
        break;
      default:
        console.error("Invalid action");
    }
  }

  const confirmDeleteChat = () => {
    if (chatIDToDelete) {
      backendAPI.delete(`/chat/${chatIDToDelete}`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      })
      .then(() => {
        setChats((prevChats) => prevChats.filter((chat) => chat.chat_id !== chatIDToDelete));
        if (chatIDToDelete === activeChat.chat_id) {
          setActiveChat({} as Chat);
          setActiveMessages([]);
          setLastMessageID(0);
          setImgSrc(undefined);
          setCurrentSlidePage(1);
          setCurrentSlide({} as Slide);
          setPresentationFiles([]);
          setActiveFile({ filename: '', slide_id: '' });
          setInputMessage('');
          setIsLoading(false);
        }
      })
      .catch((error) => {
        console.error("Error deleting chat:", error);
        setIsLoading(false);
      })
      .finally(() => {
        setIsAlertDialogOpen(false);
        setChatIDToDelete("");
      });
    }
  };

  return (
    <div>
      {/* <Navbar /> TODO: add navbar component, when hovered at the top it should display */}
      <div className="flex h-screen bg-background">
        {/* Sidebar */}
        <Sidebar 
          courses={courses.map(course => ({ course_id: course.course_id, course_title: course.course_name, course_code: course.course_code }))}
          chats={chats}
          selectedCourse={course.course_name}
          isSidebarOpen={isSidebarOpen}
          handleChatAction={handleChatAction}
          handleCourseChange={(courseID) => {
            router.push(`/course/${courseID}/instructor`);
          }}
        />
    
        {/* Main Content */}
        <div className={`flex-1 transition-all duration-300 ease-in-out ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
          {activeChat && activeChat.chat_id ? (
            <>
              {activeChat.slides_mode ? (
                <ResizablePanelGroup direction="horizontal">
                  <ResizablePanel defaultSize={50} minSize={30}>
                    <div className="h-full flex flex-col">
                      {/* Toggle sidebar button and file selection dropdown */}
                      <div className="p-4 flex justify-between items-center">
                        {/* Toggle sidebar button - Only shown in slides mode */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setIsSidebarOpen((prev) => !prev)}
                          aria-label="Toggle sidebar"
                        >
                          <Menu className="h-6 w-6" />
                        </Button>

                        <Select onValueChange={handleFileChange} value={currentSlide.slide_id}>
                          <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Select a file" />
                          </SelectTrigger>
                          <SelectContent>
                            {presentationFiles.map((file) => (
                              <SelectItem key={file.slide_id} value={file.slide_id}>
                                {file.slides_file_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Slide content */}
                      <div className="flex-1 p-4 flex flex-col items-center">
                        {/* Centered page number */}
                        <h2 className="text-2xl font-bold mb-4">Slide {currentSlidePage}</h2>

                        <div className="bg-muted rounded-lg shadow-lg overflow-hidden max-w-full max-h-full mb-4 flex-1">
                          <img 
                            src={imgSrc}
                            alt={`Presentation Slide ${currentSlide}`}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="flex gap-4">
                          <Button onClick={handlePreviousSlide} disabled={isLoading || currentSlidePage === 1}>
                            <ArrowLeft className="mr-2 h-4 w-4" /> Previous
                          </Button>
                          <Button onClick={handleNextSlide} disabled={isLoading || currentSlidePage === currentSlide.pages_count}>
                            Next <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </ResizablePanel>
                  <ResizableHandle />
                  <ResizablePanel defaultSize={50} minSize={30}>
                    <ChatInterface
                      messages={activeMessages}
                      input={inputMessage}
                      handleInputChange={(e) => setInputMessage(e.target.value)}
                      handleSubmit={(e) => {
                        e.preventDefault();
                        handleSendMessage();
                      }}
                      isChatLoading={isLoading}
                      chatContainerRef={messagesEndRef}
                      activeChat={activeChat}
                      showToggleSidebarButton={false}
                      setIsSidebarOpen={setIsSidebarOpen}
                    />
                  </ResizablePanel>
                </ResizablePanelGroup>
              ) : (
                // Chat-only mode
                <ChatInterface
                  messages={activeMessages}
                  input={inputMessage}
                  handleInputChange={(e) => setInputMessage(e.target.value)}
                  handleSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  isChatLoading={isLoading}
                  chatContainerRef={messagesEndRef}
                  activeChat={activeChat}
                  showToggleSidebarButton={true}
                  setIsSidebarOpen={setIsSidebarOpen}
                />
              )}
            </>
          ) : (
            /* Placeholder part, when initially no chat is clicked */
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-4">Welcome to Presentation Chat</h2>
                <p className="text-muted-foreground">Select a chat from the sidebar or create a new one to get started.</p>
              </div>
            </div>
          )}
        </div>
    
        {/* Create Chat Sheet */}
        <CreateChatSheet
          isOpen={isSheetOpen}
          closeModal={() => setIsSheetOpen(false)}
          authToken={token}
          onChatCreated={handleNewChat}
        />

        {/* Delete Chat Dialog */}
        <AlertDialog open={isAlertDialogOpen} onOpenChange={setIsAlertDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete this chat
                and its data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteChat}>Continue</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </div>
    </div>
  );  
}
