"use client";

import type React from "react";
import {useCallback, useEffect, useRef, useState} from "react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import type { ChatResizablePanelsProps, Slide, ChatHistoryResponse } from "@/app/types";
import SlidePanel from "@/components/chat/slide-panel";
import ChatInterface from "@/components/chat/chat-interface";
import {chatService, filemanagerService} from "@/environment/backend_api";
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
  const [presentationFiles, setPresentationFiles] = useState<{slide_id: string, slides_file_name: string}[]>([]);
  const [activeFile, setActiveFile] = useState<{ filename: string; slide_id: string }>({
    filename: "",
    slide_id: "",
  });
  const [activeMessages, setActiveMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState(''); // Text field input in the chat
  const [inputFile, setInputFile] = useState<File | null>(null); // File input in the chat
  const token = Cookies.get("authToken") as string;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Reset chat state function
  const resetChatState = useCallback(() => {
    setImgSrc(undefined);
    setCurrentSlide({} as Slide);
    setCurrentSlidePage(1);
    setIsSlidesLoading(false);
    setIsMessagesLoading(false);
    setActiveMessages([]);
    setPresentationFiles([]);
    setActiveFile({ filename: "", slide_id: "" });
    setInputMessage('');
    setInputFile(null);
  }, []);


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

  useEffect(() => {
    const abortController = new AbortController();
    resetChatState();
    if (!activeChat) return;

    const slideID = activeChat.slides_mode ? activeChat.last_opened_slide_id : null;
    if (slideID) {
      setPresentationFiles(
        activeChat.slides
          ? activeChat.slides.map((slide) => ({
              slide_id: slide.slide_id,
              slides_file_name: slide.slides_file_name,
            }))
          : []
      );
      fetchSlideInfo(slideID)
        .then((response) => {
          // Check if this request was aborted or if activeChat changed
          if (abortController.signal.aborted) return;

          const slide: Slide = response.data;
          const lastPageNumber = slide.last_opened_page_number; // last page seen by user

          setActiveFile({ filename: slide.slides_file_name, slide_id: slide.slide_id });
          setCurrentSlide(slide);
          setCurrentSlidePage((lastPageNumber));

          return fetchSlidePage(slideID, lastPageNumber);
        })
        .then(async (response) => {
          if (!response || abortController.signal.aborted) return;

          const slideBase64 = response.data.slide;
          const history = response.data.history;
          const formattedHistory = await formatHistory(history);

          setImgSrc(`data:image/png;base64,${slideBase64}`);
          setActiveMessages(formattedHistory);
        })
        .catch((error) => {
          if (!abortController.signal.aborted) {
            console.error("Error fetching slide:", error);
          }
        });
    } else {
      const chatID = activeChat.chat_id;

      if (chatID) {
        fetchChat(chatID)
          .then(async (response) => {
            if (abortController.signal.aborted) return;
            
            const history = response.data.history;
            const formattedHistory = await formatHistory(history, abortController.signal);
            setActiveMessages(formattedHistory);
          })
          .catch((error) => {
            if (!abortController.signal.aborted) {
              console.error("Error fetching chat messages:", error);
            }
          });
      }
    }

    // Cleanup function to abort fetches if component unmounts or activeChat changes
    return () => {
      abortController.abort();
    };
  }, [activeChat, resetChatState]);

  // Fetch slide info and messages when activeFile changes (for slide-enabled chats)
  useEffect(() => {
    if (!activeFile.filename || !activeChat || !activeChat.slides_mode) return;
  
    const abortController = new AbortController();
    setIsSlidesLoading(true);
    setIsMessagesLoading(true);
  
    if (activeFile.filename) {
      fetchSlideInfo(activeFile.slide_id)
        .then((response) => {
          if (abortController.signal.aborted) return;
          
          const slide: Slide = response.data;
          const lastSlideNumber = slide.last_opened_page_number;
  
          setCurrentSlide(slide);
          setCurrentSlidePage(lastSlideNumber);
          return fetchSlidePage(activeFile.slide_id, lastSlideNumber);
        })
        .then(async (response) => {
          if (!response || abortController.signal.aborted) return;
          
          const slideBase64 = response.data.slide;
          const history = response.data.history;
          setImgSrc(`data:image/png;base64,${slideBase64}`);
          
          // Only format and update messages if not aborted
          if (!abortController.signal.aborted) {
            const formattedHistory = await formatHistory(history, abortController.signal);
            setActiveMessages(formattedHistory);
          }
        })
        .catch((error) => {
          if (!abortController.signal.aborted) {
            console.error("Error fetching slide info:", error);
          }
        })
        .finally(() => {
          if (!abortController.signal.aborted) {
            setIsSlidesLoading(false);
            setIsMessagesLoading(false);
          }
        });
    }
  
    return () => {
      abortController.abort();
      // Force immediate cleanup when switching
      setIsSlidesLoading(false);
      setIsMessagesLoading(false);
    };
  }, [activeFile, activeChat]);

  // Scroll to bottom of chat messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeMessages]);

  // Functions
  const fetchMediaData = (fid: string) => {
    if (!token || !fid) {
      return Promise.reject(new Error("Invalid parameters"));
    }

    return filemanagerService.get(`/${fid}`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
  };

  const formatHistory = async (history: Message[], signal?: AbortSignal) => {
    // Early return if aborted
    if (signal?.aborted) return [];
    
    try {
      return await Promise.all(
        history.map(async (message: any) => {
          // Check if aborted before each message processing
          if (signal?.aborted) throw new Error("Aborted");
          
          let media_urls: string[] = [];
          let media_types: string[] = [];
          let filenames: string[] = [];
  
          if (message.fids?.length) {
            // Wait for all URL fetches to complete
            const media_data = await Promise.all(
              message.fids.map(async (fid: string) => {
                // Check if aborted before each fetch
                if (signal?.aborted) throw new Error("Aborted");
                const response = await fetchMediaData(fid);
                return response.data;
              })
            );
  
            // Extract URLs, types and filenames from media data
            media_urls = media_data.map(data => data.file_url);
            media_types = media_data.map(data => data.mime_type);
            filenames = media_data.map(data => data.file_name);
          }
  
          return {
            text: message.content,
            role: message.role,
            media_urls,
            media_types,
            filenames,
          };
        })
      );
    } catch (error) {
      // If aborted, return empty array
      if (signal?.aborted) return [];
      throw error;
    }
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeMessages]);

  const handlePreviousSlide = () => {
    if (!activeChat || !activeChat.last_opened_slide_id) {
      console.error("Invalid active chat or slide ID");
      return;
    }
    setIsSlidesLoading(true);
    fetchSlidePage(activeChat.last_opened_slide_id, currentSlidePage - 1)
      .then(async (response) => {
        const slideBase64 = response.data.slide;
        const history = response.data.history;
        setImgSrc(`data:image/png;base64,${slideBase64}`);
        setCurrentSlidePage(currentSlidePage - 1);
        const formattedHistory = await formatHistory(history);
        setActiveMessages(formattedHistory);
      })
      .catch((error) => {
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
    if (!activeChat || !activeChat.last_opened_slide_id) {
      console.error("Invalid active chat or slide ID");
      return;
    }
    setIsSlidesLoading(true);
    fetchSlidePage(activeChat.last_opened_slide_id, currentSlidePage + 1)
      .then(async (response) => {
        const slideBase64 = response.data.slide;
        const history = response.data.history;
        setImgSrc(`data:image/png;base64,${slideBase64}`);
        setCurrentSlidePage(currentSlidePage + 1);
        const formattedHistory = await formatHistory(history);
        setActiveMessages(formattedHistory);
      })
      .catch((error) => {
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
    setIsSlidesLoading(true);
    return fetchSlidePage(slideID, pageNumber)
      .then(async (response) => {
        const slideBase64 = response.data.slide;
        const history = response.data.history;
        setImgSrc(`data:image/png;base64,${slideBase64}`);
        setCurrentSlidePage(pageNumber);
        const formattedHistory = await formatHistory(history);
        setActiveMessages(formattedHistory);
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

  const fetchSlidePage = (slideID: string, pageNumber: number) => {
    if (!token || !slideID || pageNumber <= 0) {
      console.error("Invalid parameters");
      return Promise.reject(new Error("Invalid parameters"));
    }

    return chatService.get(`/chat/slide/${slideID}/page/${pageNumber}`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const formData = new FormData();
    formData.append("text", inputMessage);

    if (inputFile) formData.append("files", inputFile);

    const newMessage: Message = {
      text: inputMessage,
      role: "user",
      filenames: inputFile ? [inputFile.name] : [],
      media_urls: inputFile ? [URL.createObjectURL(inputFile)] : [],
      media_types: inputFile ? [inputFile.type] : [], // Now an array of MIME types
    };
    setActiveMessages((messages: Message[]) => [...messages, newMessage]);
    setIsMessagesLoading(true);
    setInputMessage("");
    setInputFile(null);

    const url = activeChat?.slides_mode
    ? `/chat/${activeChat?.chat_id}/send_message?slide_id=${currentSlide.slide_id}&page_number=${currentSlidePage}`
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
        console.log("Message: ", response.data);
        const modelResponse = {
          text: response.data.text,
          role: response.data.role,
          media_url: null,
        };
        setActiveMessages((messages) => [...messages, modelResponse]);
      })
      .catch((error) => {
        console.error("Error sending message:", error);
      })
      .finally(() => {
        setIsMessagesLoading(false);
      });
  };


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
