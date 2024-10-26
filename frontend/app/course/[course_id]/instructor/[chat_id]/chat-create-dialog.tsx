"use client";

import { documentMimeTypes, imageMimeTypes } from "@/app/constants";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ToastAction } from "@/components/ui/toast";
import { backendAPI } from "@/environment/backend_api";
import { useToast } from "@/hooks/use-toast";
import { FileIcon, FileTextIcon } from "@radix-ui/react-icons";
import Cookies from "js-cookie";
import * as React from "react";
import { useState } from "react";
import { LuUploadCloud } from "react-icons/lu";

interface ChatCreateDialogParameters {
  isOpen: boolean;
  onClose: (value: boolean) => void;
  onChatCreation: () => void;
}

export function ChatCreateDialog(dialogParameters: ChatCreateDialogParameters) {
  const [chatName, setChatName] = useState<string>("");
  const [slide, setSlide] = useState<File | null>(null);
  const [disableCreateButton, setDisableCreateButton] =
    useState<boolean>(false);
  const [token] = useState<string>(Cookies.get("authToken") as string);

  const { toast } = useToast();
  const resetFields = () => {
    setChatName("");
    setSlide(null);
  };

  // TODO: This function is not working. Redo it.
  function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<File | null>>,
    fileType: string
  ) {
    const file = event.target.files && event.target.files[0];
    handleFile(file, setter, fileType);
  }

  // TODO: This function is a duplicate.
  function handleFile(
    file: File | null,
    setter: React.Dispatch<React.SetStateAction<File | null>>,
    fileType: string
  ) {
    if (
      file &&
      fileType === "document" &&
      documentMimeTypes.includes(file.type)
    ) {
      setter(file);
    } else if (
      file &&
      fileType === "image" &&
      imageMimeTypes.includes(file.type)
    ) {
      setter(file);
    } else {
      setter(null);
      if (fileType === "document") {
        toast({
          title: "Invalid File Type",
          description: "Allowed types are: PDF, DOCX",
          variant: "destructive",
          action: <ToastAction altText="Try again">Try again</ToastAction>,
        });
      } else {
        toast({
          title: "Invalid File Type",
          description: "Allowed types are: JPG, JPEG, PNG",
          variant: "destructive",
          action: <ToastAction altText="Try again">Try again</ToastAction>,
        });
      }
    }
  }

  // TODO: This function is not working. Redo it.
  async function handleSubmit(
    event:
      | React.FormEvent<HTMLFormElement>
      | React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) {
    // Prevent default form submission
    event.preventDefault();

    // Create the form data object to send to the backend
    const formData = new FormData();
    formData.append("chat_name", chatName);
    if (slide) {
      formData.append("chat_syllabus_file", slide);
    }

    setDisableCreateButton(true);

    // Send the form data to the backend
    await backendAPI
      .post(`/chat/create`, formData, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      })
      .then(() => {
        // Call the onChatCreation callback to update the chat list
        dialogParameters.onChatCreation();
        toast({
          title: "Success",
          description: "Chat successfully created",
          variant: "default",
          action: (
            <ToastAction altText="Dismiss" className="hover:bg-background/20">
              Dismiss
            </ToastAction>
          ),
          className: "bg-green-500 text-background",
        });
      })
      .catch((error) => {
        console.log(error.response);
        toast({
          title: "Error",
          description: "Error creating chat",
          variant: "destructive",
          action: <ToastAction altText="Try again">Try again</ToastAction>,
        });
      })
      .finally(() => {
        // Reset form fields and close the modal
        setDisableCreateButton(false);
        resetFields();
        dialogParameters.onClose(false);
      });
  }

  function handleOpenChange() {
    resetFields();
    dialogParameters.onClose(false);
  }

  return (
    <Dialog
      open={dialogParameters.isOpen}
      onOpenChange={handleOpenChange}
      className="w-3/5"
    >
      <DialogContent className="border-b-neutral-800 sm:max-w-[80vh]">
        <div className="space-y-1">
          <DialogTitle className="mb-2">Create New Chat</DialogTitle>
          <DialogDescription></DialogDescription>
          <label className="text-foreground/70 text-xs font-semibold">
            Title
          </label>
          <Input
            id="chatName"
            type="text"
            value={chatName}
            onChange={(event) => setChatName(event.target.value)}
            required
          />
        </div>
        <label className="text-foreground/70 text-xs font-semibold">
          Upload slides (optional)
        </label>
        <div className="flex items-center space-x-4">
          <div
            className="flex w-1/2 flex-col items-center justify-center"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files[0];
              handleFile(file, setSlide, "document");
            }}
          >
            <label
              htmlFor="slide"
              className="flex h-[24vh] w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed"
            >
              <div className="flex flex-col items-center justify-center">
                {slide ? (
                  <div>
                    {slide.name.endsWith(".pdf") && (
                      <FileIcon className="mb-4 size-[6vh]" />
                    )}
                    {slide.name.endsWith(".docx") && (
                      <FileTextIcon className="mb-4 size-[6vh]" />
                    )}
                    <p>{slide.name}</p>
                  </div>
                ) : (
                  <div>
                    <LuUploadCloud className="text-foreground/70 mb-4 size-[6vh]" />
                    <p className="text-foreground/70 text-sm">
                      <span className="font-semibold">Click to upload</span> or
                      drag and drop
                    </p>
                    <p className="text-foreground/70 text-base">PDF or DOCX</p>
                    <span className="text-foreground/70 font-semibold">
                      (Optional)
                    </span>
                  </div>
                )}
              </div>
              <input
                id="slide"
                type="file"
                accept=".pdf,.docx"
                onChange={(event) =>
                  handleFileChange(event, setSlide, "document")
                }
                className="hidden"
              />
            </label>
          </div>
        </div>
        <div className="flex justify-end">
          <Button
            onClick={handleSubmit}
            type="submit"
            className="w-1/5"
            disabled={!chatName || disableCreateButton}
          >
            Create
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
