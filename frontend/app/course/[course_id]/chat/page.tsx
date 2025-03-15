"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Cookies from "js-cookie";
import { backendAPI } from "@/environment/backend_api";
import ChatSidebar from "@/components/chat/chat-sidebar";
import { ChatCreateDialog } from "@/components/chat/chat-create-dialog";
import { Chat, Course } from "@/app/types";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
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

            <ResizablePanelGroup direction="horizontal" className="flex-1">
              <ResizablePanel defaultSize={50} minSize={30} className="bg-card p-4">
                <div className="flex h-full items-center justify-center rounded-lg bg-muted/50">
                  <p className="text-muted-foreground">This place will be used for slides</p>
                </div>
              </ResizablePanel>

              <ResizableHandle withHandle />

              <ResizablePanel defaultSize={50} minSize={30}>
                <div className="flex h-full flex-col">
                  <Accordion type="single" collapsible className="border-b">
                    <AccordionItem value="item-1" className="border-none">
                      <AccordionTrigger className="px-4 py-3 text-foreground hover:no-underline">
                        <span className="font-medium">
                          {activeChat ? activeChat.chat_title : "Select a chat"}
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-3 text-muted-foreground">
                        {activeChat ? `Details: ${activeChat.chat_title}` : "No chat selected"}
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>

                  <div className="flex-1 overflow-auto bg-card/50 p-4">
                    {activeChat ? (
                      <div className="space-y-4">
                        <p className="text-foreground">Chatting in: {activeChat.chat_title}</p>
                        <div className="rounded-lg bg-muted/30 p-4 text-muted-foreground">
                          No messages yet. Start the conversation!
                        </div>
                      </div>
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <p className="text-muted-foreground">Select a chat to start</p>
                      </div>
                    )}
                  </div>

                  {activeChat && (
                    <div className="border-t p-4">
                      <form className="flex gap-2" onSubmit={handleSendMessage}>
                        <input
                          type="text"
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder="Type your message..."
                          className="flex-1 rounded-md border bg-background px-4 py-2 text-foreground"
                        />
                        <Button type="submit" className="rounded-md">
                          <Send className="mr-2 size-4" />
                          Send
                        </Button>
                      </form>
                    </div>
                  )}
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
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
