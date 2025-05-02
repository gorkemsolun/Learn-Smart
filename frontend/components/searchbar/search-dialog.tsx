"use client";

import { Course } from "@/app/types";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { DialogTitle } from "@/components/ui/dialog";
import { ToastAction } from "@/components/ui/toast";
import { userService } from "@/environment/backend_api";
import { useToast } from "@/hooks/use-toast";
import {HubOutlined} from "@mui/icons-material";
import { Sparkles, Swatches, ChatDots, User } from "@mynaui/icons-react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export function SearchDialogModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose?: (open: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const token = Cookies.get("authToken") as string;
  const [loading, setLoading] = useState(false);

  const startLoading = () => setLoading(true);

  const handleNavigation = async (path: string, featureName?: string) => {
    // Check if trying to access features that require courses
    if (courses.length === 0 && (featureName === "chat" || featureName === "flashcards" || featureName === "quizzes")) {
      toast({
        title: "No Course Found",
        description: `Please create a course before accessing the ${featureName}.`,
        variant: "destructive",
        action: (
          <ToastAction altText="Dismiss">
            Dismiss
          </ToastAction>
        ),
      });
      return;
    }

    setOpen(false);
    onClose?.(false);
    startLoading(); // Start loading before navigation
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
      // Fetch courses first
      const coursesResponse = await userService.get("/user", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      setCourses(coursesResponse.data?.courses || []);
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
    <CommandDialog
      open={open || isOpen}
      onOpenChange={(isOpen) => {
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
              onClick={() => handleNavigation("/all-skill-tree")}
              type="button"
              className="flex w-full cursor-pointer items-center gap-2 text-left"
            >
              <HubOutlined />
              <span>Skill Tree</span>
            </button>
          </CommandItem>
          <CommandItem asChild>
            <button
              onClick={() => handleNavigation("/profile")}
              className="flex w-full cursor-pointer items-center gap-2 text-left"
            >
              <User />
              <span>Profile</span>
            </button>
          </CommandItem>
          <CommandItem asChild>
            <button
              type="button"
              onClick={() => handleNavigation(
                courses.length === 0 ? "chat" : `/course/${courses[0].course_id}/chat`,
                "chat"
              )}
              className="flex w-full cursor-pointer items-center gap-2 text-left"
            >
              <ChatDots />
              <span>Chat</span>
            </button>
          </CommandItem>
          <CommandItem asChild>
            <button
              type="button"
              onClick={() => handleNavigation(
                courses.length === 0 ? "quizzes" : `/all-quizzes`,
                "quizzes"
              )}
              className="flex w-full cursor-pointer items-center gap-2 text-left"
            >
              <Sparkles />
              <span>Quizzes</span>
            </button>
          </CommandItem>
          <CommandItem asChild>
            <button
              type="button"
              onClick={() => handleNavigation(
                courses.length === 0 ? "flashcards" : `/all-flashcards`,
                "flashcards"
              )}
              className="flex w-full cursor-pointer items-center gap-2 text-left"
            >
              <Swatches />
              <span>Flashcards</span>
            </button>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}