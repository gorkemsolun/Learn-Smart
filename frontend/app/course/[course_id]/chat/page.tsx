"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Cookies from "js-cookie";
import { backendAPI } from "@/environment/backend_api";
import ChatSidebar from "@/components/chat/chat-sidebar";
import { ChatDialog } from "@/components/chat/chat-dialog";
import ChatResizablePanels from "@/components/chat/chat-resizable-panels";
import { Chat, Course } from "@/app/types";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/ui/sidebar";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import {ArrowRight, Loader2, MessageSquareText} from "lucide-react";

export default function ChatPage() {
  const params = useParams<{ course_id: string }>();
  const course_id = params?.course_id;
  const token = Cookies.get("authToken") as string;

  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [chatDialogOpen, setChatDialogOpen] = useState(false);
  const [chatToCreate, setChatToCreate] = useState<Chat | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [chatsLoaded, setChatsLoaded] = useState(false);

  const { toast } = useToast();

  // Handler for opening the chat dialog to create a new chat
  const handleCreateChat = () => {
    setDialogMode("create");
    setChatDialogOpen(true);
  };

  // Handler for chat actions (create/edit)
  const handleChatAction = (chat?: Chat) => {
    if (!chat) return;
    if (dialogMode === "edit" && activeChat?.chat_id === chat.chat_id) {
      setActiveChat(chat);
    } else if (dialogMode === "create") {
      setActiveChat(chat);
    }

    setChats((prevChats) => {
      const chatIndex = prevChats.findIndex((c) => c.chat_id === chat.chat_id);
      if (chatIndex !== -1) {
        const updatedChats = [...prevChats];
        updatedChats[chatIndex] = chat;
        return updatedChats;
      }
      return [...prevChats, chat];
    });
  };

  // Fetch courses for the user
  const fetchCourses = useCallback(async () => {
    if (!token) return;
    try {
      const response = await backendAPI.get("/users/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCourses(response.data?.courses || []);
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : "Unknown error";
      console.error("Error fetching courses:", errMsg);
      toast({
        title: "Error",
        description: "Failed to fetch courses.",
        variant: "destructive",
        action: (
          <ToastAction altText="Retry" onClick={fetchCourses}>
            Retry
          </ToastAction>
        ),
      });
    }
  }, [token, toast]);

  // Fetch course and chats data for the sidebar
  const fetchSidebarData = useCallback(
    async (courseId: string) => {
      if (!token || !courseId) return;
      setChatsLoaded(false);
      try {
        const courseResponse = await backendAPI.get(`/course/${courseId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCourse(courseResponse.data);

        // Simulate a short delay
        await new Promise((resolve) => setTimeout(resolve, 1500));

        const chatResponse = await backendAPI.get(`/course/${courseId}/chats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setChats(chatResponse.data || []);
      } catch (error: unknown) {
        const errMsg = error instanceof Error ? error.message : "Unknown error";
        toast({
          title: "Error",
          description: `Failed to fetch sidebar data: ${errMsg}`,
          variant: "destructive",
          action: (
            <ToastAction altText="Retry" onClick={() => course_id && fetchSidebarData(course_id)}>
              Retry
            </ToastAction>
          ),
        });
      } finally {
        setChatsLoaded(true);
      }
    },
    [token, toast, course_id]
  );

  useEffect(() => {
    if (token && course_id) {
      fetchSidebarData(course_id);
    }
  }, [token, course_id, fetchSidebarData]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);


  return (
    <div className="fixed inset-0 mt-16">
      <SidebarProvider open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        {/* Sidebar Component */}
        <Sidebar>
          <ChatSidebar
            course={course as Course}
            isLoading={!chatsLoaded}
            courses={courses as Course[]}
            activeChat={activeChat as Chat}
            chats={chats}
            setActiveChat={setActiveChat}
            fetchChats={fetchSidebarData}
          />
        </Sidebar>

        {/* Main Content */}
        <SidebarInset className="flex h-screen flex-col">
          <div className="flex items-center border-b px-4 py-2">
            <SidebarTrigger className="mr-2" />
            <h1 className="text-xl font-thin">{course?.course_name || "Course Chat"}</h1>
            <Button variant="outline" size="sm" className="ml-auto" onClick={handleCreateChat}>
              New Chat
            </Button>
          </div>

          {activeChat ? (
            <div className="flex-1 overflow-hidden">
              <ChatResizablePanels activeChat={activeChat} />
            </div>
          ) :  !chatsLoaded ? (
              <div className="absolute inset-0 flex size-full items-center justify-center">
                <Loader2 className="size-12 animate-spin text-foreground/90"/>
              </div>
          ) : (
              <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-background font-thin">
                {/* Elegant background with subtle gradients */}
              <div className="absolute inset-0 overflow-hidden opacity-60">
                <div className="absolute left-1/4 top-0 size-[500px] rounded-full bg-gradient-to-b from-primary/5 to-transparent blur-[120px]" />
                <div className="absolute bottom-0 right-1/4 size-[400px] rounded-full bg-gradient-to-t from-primary/5 to-transparent blur-[100px]" />
                <div className="absolute bottom-1/4 left-0 size-[300px] rounded-full bg-gradient-to-r from-secondary/5 to-transparent blur-[80px]" />
              </div>

              {/* Subtle animated lines */}
              <div className="absolute inset-0 overflow-hidden opacity-20">
                <div className="absolute left-0 top-[10%] h-px w-full bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                <div className="absolute left-0 top-[60%] h-px w-full bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
                <div className="absolute left-[20%] top-0 h-full w-px bg-gradient-to-b from-transparent via-secondary/20 to-transparent" />
                <div className="absolute left-[80%] top-0 h-full w-px bg-gradient-to-b from-transparent via-secondary/20 to-transparent" />
              </div>

              {/* Content container */}
               <div className="relative z-10 flex max-w-2xl flex-col items-center px-6 py-16 text-center">
                 <div className="relative mb-12">
                   <div
                       className="absolute -inset-8 rounded-full bg-gradient-to-r from-primary/5 to-secondary/5 opacity-70 blur-2xl"/>
                   <div
                       className="absolute -inset-6 rounded-full bg-gradient-to-r from-primary/5 to-secondary/5 opacity-50 blur-xl"/>
                   <div
                       className="relative flex size-20 items-center justify-center rounded-full border border-primary/10 bg-background/80 shadow-sm backdrop-blur-sm">
                     <MessageSquareText className="size-8 text-primary/80"/>
                   </div>
                   <div className="absolute -bottom-1 -right-1 size-3 rounded-full bg-primary"/>
                   <div className="absolute -bottom-1 -right-1 size-3 animate-ping rounded-full bg-primary"/>
                 </div>

                 <h1 className="mb-6 text-4xl tracking-tight text-foreground">
                   Welcome to your Chatbot
                 </h1>

                 <div className="mb-2 h-px w-16 bg-primary/30"/>

                 <p className="mb-12 max-w-lg text-lg leading-relaxed text-foreground/80">
                   Discover a new way to explore ideas, find answers to your
                   questions with our sophisticated AI assistant.
                 </p>

                 {chatsLoaded && chats.length === 0 && (
                    <button
                      onClick={() => setChatDialogOpen(true)}
                      className="group relative flex items-center overflow-hidden rounded-md border border-primary/20 bg-background px-6 py-3 text-sm font-medium text-primary shadow-sm transition-all duration-300 hover:border-primary/40 hover:bg-primary/5 hover:shadow-md"
                    >
                      Begin Your Experience
                      <span className="ml-2 inline-block transition-transform duration-300 group-hover:translate-x-1">
                        <ArrowRight className="size-4" />
                      </span>
                    </button>
                 )}
               </div>
             </div>
          )}
        </SidebarInset>

        {/* Chat Dialog */}
        <ChatDialog
            isOpen={chatDialogOpen}
            onClose={() => {
              setChatDialogOpen(false);
              setChatToCreate(null);
            }}
            onChatAction={handleChatAction}
            chat={chatToCreate}
            mode={dialogMode}
        />
      </SidebarProvider>
    </div>
  );
}
