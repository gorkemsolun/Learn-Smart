"use client";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {DialogTitle} from "@/components/ui/dialog";
import HubIcon from '@mui/icons-material/Hub';
import ChatIcon from '@mui/icons-material/Chat';
import PersonIcon from '@mui/icons-material/Person';
import React, {useCallback, useEffect, useState} from "react";
import {useRouter} from "next/navigation";
import {Course} from "@/app/types";
import {backendAPI} from "@/environment/backend_api";
import {ToastAction} from "@/components/ui/toast";
import Cookies from "js-cookie";
import {useToast} from "@/hooks/use-toast";

export function SearchDialogModal({ isOpen, onClose }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const token = Cookies.get("authToken") as string;

  const handleNavigation = async (path) => {
    setOpen(false);
    onClose?.(false);
    await router.replace(path);
  };

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const { toast } = useToast();

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

  useEffect(() => {
    if (open || isOpen) {
      fetchCourses();
    }
  }, [open, isOpen, fetchCourses]);


  return (
    <CommandDialog open={open || isOpen} onOpenChange={(isOpen) => {
        setOpen(isOpen);
        onClose?.(isOpen);
      }}
    >
      <DialogTitle></DialogTitle>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Features">
          <CommandItem asChild>
            <button
              onClick={() => handleNavigation("/skill-tree")}
              className="flex w-full cursor-pointer items-center gap-2 text-left"
            >
              <HubIcon />
              <span>Skill Tree</span>
            </button>
          </CommandItem>
          <CommandItem asChild>
            <button
              onClick={() => handleNavigation("/profile")}
              className="flex w-full cursor-pointer items-center gap-2 text-left"
            >
              <PersonIcon />
              <span>Profile</span>
            </button>
          </CommandItem>
          <CommandItem asChild>
            <button
              onClick={() =>
                handleNavigation(
                  courses.length === 0
                    ? "error_chat"
                    : `/course/${courses[0].course_id}/chat`
                )
              }
              className="flex w-full cursor-pointer items-center gap-2 text-left"
            >
            <ChatIcon />
            <span>Chat</span>
          </button>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
