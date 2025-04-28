"use client";

import type React from "react";
import {useEffect, useRef, useState} from "react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import type { ChatResizablePanelsProps, Slide, SlideResponse, ChatHistoryResponse } from "@/app/types";
import SlidePanel from "@/components/chat/slide-panel";
import ChatInterface from "@/components/chat/chat-interface";
import {backend, backendAPI, chatService} from "@/environment/backend_api";
import { toast } from "@/hooks/use-toast";
import Cookies from "js-cookie";
import {Message} from "@/app/types";

export default function ChatResizablePanels({
  activeChat
}: ChatResizablePanelsProps) {

  // States for slides and presentation handling
  const [imgSrc, setImgSrc] = useState<string | undefined>(undefined); // Image source for the slide
  const [currentSlide, setCurrentSlide] = useState<Slide>({} as Slide); // Current slide info
  const [currentSlidePage, setCurrentSlidePage] = useState(1); // Current slide page number
  const [isSlidesLoading, setIsSlidesLoading] = useState(false); // Loading state for slide fetches
  const [isMessagesLoading, setIsMessagesLoading] = useState(false); // Loading state for slide fetches
  const [presentationFiles, setPresentationFiles] = useState<{ slide_id: string; slides_file_name: string }[]>([]);
  const [activeFile, setActiveFile] = useState<{ filename: string; slide_id: string }>({
    filename: "",
    slide_id: "",
  });
  const [activeMessages, setActiveMessages] = useState<Message[]>([]);
  const [lastMessageID, setLastMessageID] = useState<number>(0);
  const [inputMessage, setInputMessage] = useState(''); // Text field input in the chat
  const [inputFile, setInputFile] = useState<File | null>(null); // File input in the chat
  const token = Cookies.get("authToken") as string;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Helper function to fetch the chat (when slides are not enabled)
  const fetchChat = (chatID: string) => {
    if (!token || !chatID) {
      return Promise.reject(new Error("Invalid parameters"));
    }
    return chatService.get<ChatHistoryResponse>(`/chat/${chatID}`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
  };

  // API call to fetch slide info
  const fetchSlideInfo = (slideID: string) => {
    if (!token || !slideID) return Promise.reject(new Error("Invalid parameters"));
    return chatService.get<Slide>(`/slides/${slideID}`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
  };

  // API call to fetch a specific slide page
  const fetchSlide = (chatID: string, slideID: string, pageNumber: number) => {
    if (!token || !chatID || !slideID || pageNumber <= 0) {
      console.error("Invalid parameters");
      return Promise.reject(new Error("Invalid parameters"));
    }
    return chatService.get<SlideResponse>(`/chat/slide/${slideID}/page/${pageNumber}`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
  };

  // Fetch slide info and image when activeChat changes
  useEffect(() => {
    if (!activeChat) return;

    // Check if this chat uses slides
    if (activeChat.slides_mode && activeChat.last_opened_slide_id) {
      const slideID = activeChat.last_opened_slide_id;
      // TO-DO Backend does not save the slides information
      setPresentationFiles(
        activeChat.slides
          ? activeChat.slides.map((slide) => ({
              slide_id: slide.slide_id,
              slides_file_name: slide.slides_file_name,
            }))
          : []
      );

      fetchSlideInfo(slideID)
        .then(({ data: slide }) => {
          const lastSlideNumber = slide.last_slide_number;

          setActiveFile({ filename: slide.slides_file_name, slide_id: slide.slide_id });
          setCurrentSlide(slide);
          setCurrentSlidePage(lastSlideNumber);

          return fetchSlide(activeChat.chat_id, slideID, lastSlideNumber);
        })
        .then(({ data }) => {
          const slideBase64 = data.slide;
          const history = data.history || [];

          setImgSrc(`data:image/png;base64,${slideBase64}`);
          setActiveMessages(history);
          setLastMessageID(history.length > 0 ? history[history.length - 1].message_id : 0);
        })
        .catch((error) => {
          console.error("Error fetching slide data:", error);
          toast({
            title: "Error",
            description: "Failed to load slide data",
            variant: "destructive",
          });
        });
    } else {
      // For chats that do not have slide mode enabled, fall back to loading chat messages
      setActiveFile({ filename: "", slide_id: "" });
      setCurrentSlide({} as Slide);
      setCurrentSlidePage(-1);
      setPresentationFiles([]);
      setImgSrc(undefined);

      fetchChat(activeChat.chat_id)
        .then(({ data }) => {
          const history = data.history || [];
          setActiveMessages(history);
          setLastMessageID(history.length > 0 ? history[history.length - 1].message_id : 0);
        })
        .catch((error) => {
          console.error("Error fetching chat messages:", error);
          toast({
            title: "Error",
            description: "Failed to load chat messages",
            variant: "destructive",
          });
        });
    }
  }, [activeChat]);

  // Fetch slide info and messages when activeFile changes (for slide-enabled chats)
  useEffect(() => {
    if (!activeFile.filename || !activeChat || !activeChat.slides_mode) return;

    setIsSlidesLoading(true);
    setIsMessagesLoading(true);

    fetchSlideInfo(activeFile.slide_id)
      .then(({ data: slide }) => {
        const lastSlideNumber = slide.last_slide_number;

        setCurrentSlide(slide);
        setCurrentSlidePage(lastSlideNumber);

        return fetchSlide(activeChat.chat_id, activeFile.slide_id, lastSlideNumber);
      })
      .then(({ data }) => {
        const slideBase64 = data.slide;
        const history = data.history || [];

        setImgSrc(`data:image/png;base64,${slideBase64}`);
        setActiveMessages(history);
        setLastMessageID(history.length > 0 ? history[history.length - 1].message_id : 0);
      })
      .catch((error) => {
        console.error("Error fetching slide data:", error);
        toast({
          title: "Error",
          description: "Failed to load slide data",
          variant: "destructive",
        });
      })
      .finally(() => {
        setIsSlidesLoading(false);
        setIsMessagesLoading(false);
      });
  }, [activeFile, activeChat]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeMessages]);

  // Handle slide navigation
  const handlePreviousSlide = () => {
    if (!activeChat || !activeChat.last_opened_slide_id || currentSlidePage <= 1) {
      return;
    }

    setIsSlidesLoading(true);

    fetchSlide(activeChat.chat_id, activeChat.last_opened_slide_id, currentSlidePage - 1)
      .then(({ data }) => {
        const slideBase64 = data.slide;
        const history = data.history || [];

        setImgSrc(`data:image/png;base64,${slideBase64}`);
        setCurrentSlidePage(currentSlidePage - 1);
        setActiveMessages(history);
        setLastMessageID(history.length > 0 ? history[history.length - 1].message_id : 0);
      })
      .catch((error) => {
        console.error("Error fetching previous slide:", error);
        toast({
          title: "Error",
          description: "Failed to fetch previous slide",
          variant: "destructive",
        });
      })
      .finally(() => {
        setIsSlidesLoading(false);
      });
  };

  const handleNextSlide = () => {
    if (!activeChat || !activeChat.last_opened_slide_id || currentSlidePage >= (currentSlide.pages_count || 1)) {
      return;
    }

    setIsSlidesLoading(true);

    fetchSlide(activeChat.chat_id, activeChat.last_opened_slide_id, currentSlidePage + 1)
      .then(({ data }) => {
        const slideBase64 = data.slide;
        const history = data.history || [];

        setImgSrc(`data:image/png;base64,${slideBase64}`);
        setCurrentSlidePage(currentSlidePage + 1);
        setActiveMessages(history);
        setLastMessageID(history.length > 0 ? history[history.length - 1].message_id : 0);
      })
      .catch((error) => {
        console.error("Error fetching next slide:", error);
        toast({
          title: "Error",
          description: "Failed to fetch next slide",
          variant: "destructive",
        });
      })
      .finally(() => {
        setIsSlidesLoading(false);
      });
  };

  // Handle file change for slide selection
  const handleFileChange = (slide_id: string) => {
    const selectedFile = presentationFiles.find((file) => file.slide_id === slide_id);
    if (selectedFile) {
      setActiveFile({ filename: selectedFile.slides_file_name, slide_id: selectedFile.slide_id });
    }
    if (activeChat) {
      // Update activeChat's last opened slide id (if slides are enabled)
      if (activeChat.slides_mode) {
        activeChat.last_opened_slide_id = slide_id;
      }
    }
  };

  const handleFetchSlide = (slideID: string, pageNumber: number) => {
    const chatID =
      activeChat && "chat_id" in activeChat ? activeChat.chat_id : "";
    setIsSlidesLoading(true);
    return fetchSlide(chatID, slideID, pageNumber)
      .then(({ data }) => {
        const slideBase64 = data.slide;
        const history = data.history || [];
        // Update the image source, which should trigger the <img> onLoad in SlidePanel
        setImgSrc(`data:image/png;base64,${slideBase64}`);
        setCurrentSlidePage(pageNumber);
        setActiveMessages(history);
        setLastMessageID(
          history.length > 0 ? history[history.length - 1].message_id : 0
        );
        return data;
      })
      .catch((error) => {
        console.error("Error fetching slide:", error);
        toast({
          title: "Error",
          description: "Failed to fetch slide data",
          variant: "destructive",
        });
      })
      .finally(() => {
        setIsSlidesLoading(false);
      });
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const formData = new FormData();
    formData.append("text", inputMessage);

    console.log(formData);

    if (inputFile) formData.append("file", inputFile);

    const newMessage: Message = {
      text: inputMessage,
      role: "user",
      message_id: lastMessageID + 1,
      media_url: inputFile ? URL.createObjectURL(inputFile) : null,
    };

    setActiveMessages((messages: Message[]) => [...messages, newMessage]);
    setIsMessagesLoading(true);
    setInputMessage("");
    if (inputFile) setInputFile(null);

    const url = activeChat?.slides_mode
    ? `/chat/${activeChat.chat_id}/send_message?slide_id=${currentSlide.slide_id}&page_number=${currentSlidePage}`
    : `/chat/${activeChat?.chat_id}/send_message`;

    chatService
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
        setIsMessagesLoading(false);
      });

  };
  console.log(presentationFiles);
  return (
    <ResizablePanelGroup direction="horizontal" className="max-h-[calc(100%-4rem)] flex-1">
      {activeChat ? (
        <>
          {activeChat.slides_mode ? (
            <>
              <SlidePanel
                imgSrc={imgSrc}
                currentSlidePage={currentSlidePage}
                totalPages={currentSlide.pages_count}
                isSlidesLoading={isSlidesLoading}
                presentationFiles={presentationFiles}
                currentSlide={currentSlide}
                onFileChange={handleFileChange}
                onPreviousSlide={handlePreviousSlide}
                onNextSlide={handleNextSlide}
                fetchSlide={handleFetchSlide}
              />
              <ResizableHandle withHandle />
            </>
          ) : null}
          <ResizablePanel defaultSize={50} minSize={20}>
            <ChatInterface
              messages={activeMessages as Message[]}
              input={inputMessage}
              handleInputChange={(e) => setInputMessage(e.target.value)}
              handleInputFileChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setInputFile(e.target.files[0]);
                }
              }}
              handleSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              chatContainerRef={messagesEndRef}
              isChatLoading={isMessagesLoading}
              activeChat={activeChat}
            />
          </ResizablePanel>
        </>
      ) : null}
    </ResizablePanelGroup>
  );
}
