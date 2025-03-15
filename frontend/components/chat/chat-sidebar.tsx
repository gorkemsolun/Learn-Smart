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
} from "@/components/ui/sidebar";
import { ChevronDown, MessageSquare } from "lucide-react";
import type { Course, Chat, ChatSidebarProps } from "@/app/types";
import { backendAPI } from "@/environment/backend_api";
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {useRouter} from "next/navigation";

export default function ChatSidebar({
  course,
  isLoading,
  courses,
  activeChat,
  setActiveChat,
  chats,
}: ChatSidebarProps) {

  const router = useRouter();

  return (
    <Sidebar className="mt-[3.2rem]">
      <SidebarHeader className="sticky border-b bg-card px-2 py-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-between">
              <span className="truncate">{course?.course_name || "Select a Course"}</span>
              <ChevronDown className="ml-2 size-4 shrink-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[var(--radix-dropdown-menu-trigger-width)]">
            {courses.length > 0 ? (
              courses.map((c) => (
                <DropdownMenuItem
                  key={c.course_id}
                  onClick={() => {
                    router.replace(`/course/${c.course_id}/chat`);
                  }}
                >
                  <span className="truncate">{c.course_name}</span>
                </DropdownMenuItem>
              ))
            ) : (
              <DropdownMenuItem disabled={true}>
                <span className="text-muted-foreground">No courses available</span>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarHeader>

      <SidebarContent className="h-[calc(100vh-10rem)]">
        <SidebarGroup>
          <div className="flex items-center justify-between px-2">
            <SidebarGroupLabel>Chats</SidebarGroupLabel>
          </div>
          <SidebarGroupContent>
            <ScrollArea className="h-[calc(100vh-16rem)]">
              <SidebarMenu>
                {isLoading ? (
                  <div className="flex justify-center py-4">
                    <p className="text-sm text-muted-foreground">Loading chats...</p>
                  </div>
                ) : chats.length > 0 ? (
                  chats.map((chat) => (
                    <SidebarMenuItem key={chat.chat_id}>
                      <SidebarMenuButton
                        isActive={activeChat?.chat_id === chat.chat_id}
                        className="w-full text-left"
                        onClick={() =>
                          setActiveChat({
                            chat_id: chat.chat_id,
                            chat_title: chat.chat_title,
                          } as Chat)
                        }
                      >
                        <MessageSquare className="size-4 shrink-0" />
                        <span className="truncate">{chat.chat_title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <MessageSquare className="mb-2 size-8 text-muted-foreground" />
                    <h3 className="mb-1 text-sm font-medium">No chats yet</h3>
                    <p className="text-xs text-muted-foreground">Create a new chat to get started</p>
                  </div>
                )}
              </SidebarMenu>
            </ScrollArea>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

