"use client"
import { useParams, useRouter } from "next/navigation";
import React, { useState, useEffect, useRef } from 'react'
import Cookies from "js-cookie";
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChevronLeft, ChevronRight, MessageSquare, Plus, Send, ArrowLeft, ArrowRight } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { Course, Chat, Slide, Message } from '@/app/types'
import { backend, backendAPI } from '@/environment/backend_api'
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
import ChatInterface from "@/components/chat-interface";

export default function InstructorPage() {
  const router = useRouter();
  const [token, setToken] = useState<string>("");

  const [course, setCourse] = useState<Course>({} as Course);
  const [chats, setChats] = useState<{chat_id: string, chat_title: string}[]>([]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [imgSrc, setImgSrc] = useState('')
  const [currentSlidePage, setCurrentSlidePage] = useState(1)
  const [activeChat, setActiveChat] = useState<Chat>({} as Chat)
  const [activeMessages, setActiveMessages] = useState<Message[]>([])
  const [lastMessageID, setLastMessageID] = useState(0)
  const [inputMessage, setInputMessage] = useState('')
  const [currentSlide, setCurrentSlide] = useState<Slide>({} as Slide)
  const [presentationFiles, setPresentationFiles] = useState<{slide_id: string, slides_file_name: string}[]>([])
  const [activeFile, setActiveFile] = useState<{filename: string, slide_id: string}>({ filename: '', slide_id: '' })
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const params = useParams<{ course_id: string }>();
  const courseID = params.course_id;

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
      fetchAllChats();
    }
  }, [token]);

  // Fetch active chat's slide info and messages
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
    await backendAPI
      .get(`/chat/${chatID}`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => {
        setActiveChat(response.data);
        /* fetchSlide() */
        console.log("response.data");
        console.log(response.data);
        console.log("hist:");
        console.log(response.data.history);
        setActiveMessages(response.data.history || []);
        setLastMessageID(response.data.history[response.data.history.length - 1]?.message_id);
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

    backendAPI
      .post(`/chat/${activeChat?.chat_id}/send_message?slide_id=${currentSlide.slide_id}&page_number=${currentSlidePage}`, 
        formData, {
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

  const handleNewChat = () => {
    console.log("Create new chat clicked");
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className={`${isSidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 ease-in-out overflow-hidden border-r border-border`}>
        <div className="p-4">
          <Button onClick={handleNewChat} className="w-full mb-4">
            <Plus className="mr-2 h-4 w-4" /> New Chat
          </Button>
          <ScrollArea className="h-[calc(100vh-5rem)]">
            {chats.map(chat => (
              <Button
                key={chat.chat_id}
                variant={chat.chat_id === activeChat.chat_id ? "secondary" : "ghost"}
                className="w-full justify-start mb-2"
                onClick={() => handleChatSelection(chat.chat_id)}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                {chat.chat_title}
              </Button>
            ))}
          </ScrollArea>
        </div>
      </div>

      {/* Toggle Sidebar Button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 left-4 z-10"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        {isSidebarOpen ? <ChevronLeft /> : <ChevronRight />}
      </Button>

      {/* Main Content */}
      <div className="flex-1">
        {activeChat && activeChat.chat_id ? (
          activeChat.slides_mode ? (
            <ResizablePanelGroup direction="horizontal">
              <ResizablePanel defaultSize={50} minSize={30}>
                <div className="h-full flex flex-col">
                  {/* File selection dropdown */}
                  <div className="p-4 flex justify-end">
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
            />
          )
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
  </div>
  )
}
