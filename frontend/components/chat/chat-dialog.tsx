"use client";

import { documentMimeTypes } from "@/app/constants";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToastAction } from "@/components/ui/toast";
import { chatService } from "@/environment/backend_api";
import { useToast } from "@/hooks/use-toast";
import { FileIcon, FileTextIcon } from 'lucide-react';
import Cookies from "js-cookie";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import type { ChatDialogProps } from "@/app/types";

/*
* TO-DO write the backend for the edit where you may change the current slide with another,
* users will also be able to add multiple slides this one will change the current slide only.
* */
export function ChatDialog({ isOpen, onClose, onChatAction, chat, mode }: ChatDialogProps) {
  const params = useParams<{ course_id: string }>();
  const course_id = params.course_id;
  const [chatName, setChatName] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const authToken = Cookies.get("authToken") as string;
  const { toast } = useToast();

  const isEditMode = mode === "edit";

  // Set initial chat name when chat changes or dialog opens
  useEffect(() => {
    if (isOpen) {
      if (isEditMode && chat) {
        setChatName(chat.chat_title);
      } else if (!isEditMode) {
        setChatName("");
      }
    }
  }, [chat, isOpen, isEditMode]);

  const resetFields = () => {
    if (isEditMode && chat) {
      setChatName(chat.chat_title);
    } else {
      setChatName("");
    }
    setFile(null);
    setErrorMessage("");
  };

  const closeModal = () => {
    resetFields();
    onClose();
  };

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0] || null;

    if (!selectedFile) return;

    if (documentMimeTypes.includes(selectedFile.type)) {
      setFile(selectedFile);
    } else {
      setFile(null);
      toast({
        title: "Invalid File Type",
        description: "Allowed types are: PDF, DOCX",
        variant: "destructive",
        action: <ToastAction altText="Try again">Try again</ToastAction>,
      });
    }
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const selectedFile = event.dataTransfer.files[0] || null;

    if (!selectedFile) return;

    if (documentMimeTypes.includes(selectedFile.type)) {
      setFile(selectedFile);
    } else {
      toast({
        title: "Invalid File Type",
        description: "Allowed types are: PDF, DOCX",
        variant: "destructive",
        action: <ToastAction altText="Try again">Try again</ToastAction>,
      });
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isEditMode && !chat) return;

    if (!chatName.trim()) {
      setErrorMessage("Please fill out this field.");
      return;
    }
    setErrorMessage("");

    setIsSubmitting(true);

    const formData = new FormData();
    if (file) {
      formData.append("slides", file);
    }
    formData.append("chat_title", chatName.trim());

    try {
      let response;
      let resultChat;

      if (isEditMode && chat) {
        // Edit mode
        response = await chatService.put(
          `/chat/${chat.chat_id}`,
          formData,
          {
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${authToken}`,
              "Content-Type": "multipart/form-data"
            },
          }
        );

        resultChat = {
          ...chat,
          chat_title: chatName.trim()
        };
      } else {
        // Create mode
        response = await chatService.post(
          `/chat/create?course_id=${course_id}&chat_title=${chatName}`,
          file ? formData : {},
          {
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${authToken}`,
              ...(file && { "Content-Type": "multipart/form-data" }),
            },
          }
        );

        resultChat = response.data.chat;
      }

      toast({
        title: "Success",
        description: `Chat successfully ${isEditMode ? 'updated' : 'created'}`,
        variant: "default",
        className: "bg-green-500 text-background",
      });

      onChatAction(resultChat);
      closeModal();
    } catch (error) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} chat:`, error);
      toast({
        title: "Error",
        description: `Failed to ${isEditMode ? 'update' : 'create'} chat. Please try again.`,
        variant: "destructive",
        action: <ToastAction altText="Try again">Try again</ToastAction>,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeModal()}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Chat' : 'Create New Chat'}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Update your chat details. You can optionally upload new slides.'
              : 'Create a new chat for your course. You can optionally upload slides.'}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-6 py-2" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="chatName" className="text-sm font-medium">
              Chat Title
            </Label>
            <Input
              id="chatName"
              value={chatName}
              onChange={(e) => {
                setChatName(e.target.value);
                if (e.target.value.trim()) {
                  setErrorMessage("");
                }
              }}
              placeholder="Enter chat title"
              className={`w-full ${errorMessage ? "border-red-500" : ""}`}
              required
            />
            {errorMessage && (
              <p className="mt-1 text-xs text-red-500">{errorMessage}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="slide" className="text-sm font-medium">
              Upload {isEditMode ? 'New ' : ''}Slides (Optional)
            </Label>
            <div
              className="flex flex-col items-center justify-center rounded-md border-2 border-dashed border-muted-foreground/25 p-6 transition-colors hover:border-muted-foreground/50"
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
            >
              {file ? (
                <div className="flex flex-col items-center text-center">
                  {file.name.endsWith(".pdf") ? (
                    <FileIcon className="mb-2 size-10 text-primary" />
                  ) : (
                    <FileTextIcon className="mb-2 size-10 text-primary" />
                  )}
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => setFile(null)}
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <label
                  htmlFor="slide-upload"
                  className="flex cursor-pointer flex-col items-center text-center"
                >
                  <div className="mb-2 rounded-full bg-primary/10 p-2">
                    <FileIcon className="size-6 text-primary" />
                  </div>
                  <p className="text-sm font-medium">
                    <span className="text-primary">Click to upload</span> or drag and drop
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    PDF or DOCX (max 10MB)
                  </p>
                </label>
              )}
              <input
                id="slide-upload"
                type="file"
                accept=".pdf,.docx"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeModal} className="mr-2">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? (isEditMode ? "Updating..." : "Creating...")
                : (isEditMode ? "Update Chat" : "Create Chat")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
