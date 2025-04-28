"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { ChevronDown, MessageSquare, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import type { Chat, ChatSidebarProps } from "@/app/types";
import { chatService } from "@/environment/backend_api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatDialog } from "@/components/chat/chat-dialog";

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
import { ToastAction } from "@/components/ui/toast";

export default function ChatSidebar({
  course,
  isLoading,
  courses,
  activeChat,
  setActiveChat,
  chats,
  fetchChats,
}: ChatSidebarProps) {
  const router = useRouter();
  const { toast } = useToast();
  const token = Cookies.get("authToken") as string;

  // State for edit dialog
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [chatDialogOpen, setChatDialogOpen] = useState(false);
  const [chatToEdit, setChatToEdit] = useState<Chat | null>(null);

  // State for delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<Chat | null>(null);

  const handleEditChat = (chat: Chat) => {
    setChatToEdit(chat);
    setDialogMode("edit");
    setChatDialogOpen(true);
  };

  const handleDeleteChat = (chat: Chat) => {
    setChatToDelete(chat);
    setDeleteDialogOpen(true);
  };

  const handleChatAction = (chat?: Chat) => {
    if (chat) {
      // For edit mode: update active chat if it's the one being edited
      if (dialogMode === "edit" && activeChat?.chat_id === chat.chat_id) {
        setActiveChat(chat);
      }
      // For create mode: set the new chat as active
      else if (dialogMode === "create") {
        setActiveChat(chat);
      }

      // Refresh chats
      if (fetchChats && course) fetchChats(course.course_id);
    }
  };

  const confirmDeleteChat = async () => {
    if (!chatToDelete || !course) return;

    try {
      await chatService.delete(`/chat/${chatToDelete.chat_id}`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (activeChat?.chat_id === chatToDelete.chat_id) {
        setActiveChat(null);
      }

      if (fetchChats && course) fetchChats(course.course_id);

      toast({
        title: "Success",
        description: `Chat "${chatToDelete.chat_title}" has been deleted.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Error deleting chat: " + (error?.message || "Unknown error"),
        variant: "destructive",
        action: (
          <ToastAction altText="Try again" onClick={() => confirmDeleteChat()}>
            Try again
          </ToastAction>
        ),
      });
    } finally {
      setDeleteDialogOpen(false);
      setChatToDelete(null);
    }
  };

  return (
    <>
      <SidebarHeader className="mt-[3.25rem] border-b bg-card px-2 py-3">
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

      <SidebarContent>
        <SidebarGroup>
          <div className="flex items-center justify-between px-2">
            <SidebarGroupLabel>Chats</SidebarGroupLabel>
          </div>
          <SidebarGroupContent>
            <ScrollArea className="h-[calc(100vh-12rem)]">
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
                          setActiveChat(chat as Chat)
                        }
                      >
                        <MessageSquare className="size-4 shrink-0" />
                        <span className="truncate">{chat.chat_title}</span>
                      </SidebarMenuButton>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <SidebarMenuAction className="focus:ring-0 focus-visible:ring-0">
                            <MoreHorizontal className="size-4" />
                          </SidebarMenuAction>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" side="right">
                          <DropdownMenuItem onClick={() => handleEditChat(chat)}>
                            <Pencil className="mr-2 size-4" />
                            <span>Edit</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteChat(chat)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 size-4" />
                            <span>Delete</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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

      {/* Combined Chat Dialog for Create/Edit */}
      <ChatDialog
        isOpen={chatDialogOpen}
        onClose={() => {
          setChatDialogOpen(false);
          setChatToEdit(null);
        }}
        onChatAction={handleChatAction}
        chat={chatToEdit}
        mode={dialogMode}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deleting Chat</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete chat &#34;{chatToDelete?.chat_title}&#34;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteChat}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

