"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Cookies from "js-cookie";
import { backendAPI } from "@/environment/backend_api";
import ChatSidebar from "@/components/chat/chat-sidebar";
import { ChatCreateDialog } from "@/components/chat/chat-create-dialog";
import ChatResizablePanels from "@/components/chat/chat-resizable-panels";
import { Chat, Course } from "@/app/types";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {ToastAction} from "@/components/ui/toast";

export default function ChatPage() {
  const params = useParams<{ course_id: string }>();
  const course_id = params?.course_id;
  const token = Cookies.get("authToken") as string;

  const [chatCreateDialog, setChatCreateDialog] = useState<boolean>(false);
  const [course, setCourse] = useState<Course | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const { toast } = useToast();

  const fetchCourses = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const response = await backendAPI.get("/users/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCourses(response.data?.courses || []);
    } catch (error) {
      console.error("Error fetching courses:", error);
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
    } finally {
      setIsLoading(false);
    }
  }, [token, toast]);

  // Fetch course and chats data
  const fetchSidebarData = useCallback(async (courseId: string) => {
    if (!token || !courseId) return;

    try {
      const courseResponse = await backendAPI.get(`/course/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCourse(courseResponse.data);

      await new Promise((resolve) => setTimeout(resolve, 300));

      const chatResponse = await backendAPI.get(`/course/${courseId}/chats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setChats(chatResponse.data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to fetch sidebar data: ${error.message}`,
        variant: "destructive",
        action: <ToastAction altText="Retry">Retry</ToastAction>,
      });
    }
  }, [token, course_id, toast]);

  useEffect(() => {
    if (token && course_id) {
      fetchSidebarData(course_id);
    }
  }, [token, course_id, fetchSidebarData]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleSendMessage = (event: React.FormEvent) => {
    event.preventDefault(); // Prevent page reload

    if (!message.trim() || !activeChat) return;

    console.log(`Sending message to chat ${activeChat.chat_id}: ${message}`);

    // Clear the input after sending
    setMessage("");
  };

  const handleChatCreated = async (newChat?: Chat) => {
      if (newChat) {
          setChats((prevChats) => [...prevChats, newChat]);
          setActiveChat(newChat);
      } else if (course_id) {
          await fetchSidebarData(course_id);
      }
  };

  return (
    <div className="fixed inset-0 mt-[3.95rem] w-full overflow-hidden bg-background">
      <SidebarProvider open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <div className="flex w-full">
          <ChatSidebar
            course={course as Course}
            isLoading = {isLoading}
            courses={courses as Course[]}
            activeChat={activeChat}
            chats={chats}
            setActiveChat={setActiveChat}
            fetchChats={fetchSidebarData}
          />

          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex items-center border-b px-4 py-2">
              <SidebarTrigger className="mr-2" />
              <h1 className="text-xl font-thin">{course?.course_name || "Course Chat"}</h1>
              <Button
                variant="outline"
                size="sm"
                className="ml-auto"
                onClick={() => setChatCreateDialog(true)}
              >
                New Chat
              </Button>
            </div>

            <ChatResizablePanels
              activeChat={activeChat}
              message={message}
              setMessage={setMessage}
              handleSendMessage={handleSendMessage}
            />
          </div>

          <ChatCreateDialog
            isOpen={chatCreateDialog}
            onClose={() => setChatCreateDialog(false)}
            onChatCreation={handleChatCreated}
          />
        </div>
      </SidebarProvider>
    </div>
  );
}
