"use client";

import { useCallback, useEffect, useState } from "react";
import Cookies from "js-cookie";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { ChevronDown } from "lucide-react";
import type { Course, Chat, ChatSidebarProps } from "@/app/types";
import { backendAPI } from "@/environment/backend_api";
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ChatSidebar({
  isOpen,
  selectedCourse,
  toggleSidebar,
  activeChat,
  setActiveChat,
}: ChatSidebarProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [currentCourse, setCurrentCourse] = useState<Course | null>(selectedCourse);
  const [chats, setChats] = useState<{ chat_id: string; chat_title: string }[]>([]);
  const token = Cookies.get("authToken") as string;
  const { toast } = useToast();

  const fetchCourses = useCallback(async () => {
    if (!token) return;
    try {
      const response = await backendAPI.get("/users/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCourses(response.data?.courses || []);
    } catch (error: never) {
      console.error("Error fetching courses:", error);
      toast({
        title: "Error",
        description: "Failed to fetch courses.",
        variant: "destructive",
        action: <ToastAction altText="Retry">Retry</ToastAction>,
      });
    }
  }, [token, toast]);

  const fetchChats = useCallback(
    async (courseID: string | undefined) => {
      if (!token || !courseID) return;
      try {
        const response = await backendAPI.get(`/course/${courseID}/chats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setChats(response.data || []);
      } catch (error) {
        console.error("Error fetching chats:", error);
      }
    },
    [token],
  );

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  useEffect(() => {
    if (currentCourse) {
      fetchChats(currentCourse.course_id);
    }
  }, [currentCourse, fetchChats]);

  return (
    <div className="fixed overflow-hidden">
      <SidebarProvider defaultOpen={isOpen}>

        <Sidebar variant="floating" className="mt-14 max-h-[90vh]">
          <SidebarHeader className="flex-col items-center justify-center border-b border-border">
            <div className="py-4 text-lg font-bold text-foreground">Menu</div>
            <SidebarMenu className="w-full pb-2">
              <SidebarMenuItem>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton className="w-full justify-between">
                      <span className="truncate">{currentCourse?.course_name || "Select a Course"}</span>
                      <ChevronDown className="ml-2 size-4 shrink-0"/>
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-[var(--radix-dropdown-menu-trigger-width)]">
                    {courses.map((course) => (
                        <DropdownMenuItem
                            key={course.course_id}
                            onClick={() => {
                              setCurrentCourse(course);
                              fetchChats(course.course_id);
                            }}
                        >
                          <span className="truncate">{course.course_name}</span>
                        </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarHeader>

          <SidebarContent className="flex-1 overflow-y-auto">
            <SidebarGroup>
              <SidebarGroupLabel className="text-muted-foreground">Chats</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {chats.length > 0 ? (
                      chats.map((chat) => (
                          <SidebarMenuItem key={chat.chat_id}>
                            <SidebarMenuButton
                                isActive={activeChat?.chat_id === chat.chat_id}
                                className={cn("w-full text-left", "transition-colors duration-200")}
                                onClick={() =>
                                    setActiveChat({
                                      chat_id: chat.chat_id,
                                      chat_title: chat.chat_title,
                                    } as Chat)
                                }
                            >
                              <span className="truncate">{chat.chat_title}</span>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                      ))
                  ) : (
                      <div className="py-4 text-center text-sm text-muted-foreground">No chats available</div>
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <div className="w-full flex-1 py-2">
          <SidebarTrigger>
            <Button onClick={toggleSidebar}>
              <span className="sr-only">Toggle sidebar</span>
            </Button>
          </SidebarTrigger>
        </div>
      </SidebarProvider>
    </div>
  );
}

