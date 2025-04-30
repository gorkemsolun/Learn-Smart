"use client";

import { documentMimeTypes, imageMimeTypes } from "@/app/constants";
import { Chat, SkillTree } from "@/app/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/hooks/use-toast";
import { FileIcon, FileTextIcon, ImageIcon } from "@radix-ui/react-icons";
import * as React from "react";
import { useState } from "react";
import { LuUpload } from "react-icons/lu";

export function SkillTreeEditCreateDialogModal(dialogParameters: {
  isOpen: boolean;
  onClose: (value: boolean) => void;
  onSkillTreeSubmit: () => void;
  skillTree?: SkillTree;
  isEdit?: boolean;
}) {
  const [skillTreeTitle, setSkillTreeTitle] = useState<string>("");
  const [chat, setChat] = useState<Chat>();
  const [skillTreeDescription, setSkillTreeDescription] = useState<string>("");
  const [files, setFiles] = useState<FileList | File | undefined>();
  const [icon, setIcon] = useState<FileList | File | undefined>();

  const { toast } = useToast();

  const resetFields = () => {
    setChat(undefined);
    setSkillTreeTitle("");
    setSkillTreeDescription("");
    setFiles(undefined);
    setIcon(undefined);
  };

  // TODO: Replace this with actual chats fetched from the backend
  const availableChats: Chat[] = [
    {
      chat_id: "1",
      chat_title: "Chat 1",
    },
    {
      chat_id: "2",
      chat_title: "Chat 2",
    },
    {
      chat_id: "3",
      chat_title: "Chat 3",
    },
  ];

  function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<FileList | File | undefined>>,
    fileType: string,
    isSingleFile: boolean = true
  ) {
    // The following line first checks if the event has a target.files property
    // then checks the isSingleFile variable to determine if it should get the first file
    // or all files from the event.target.files array. If the event has no target.files property, it sets the file_s variable to undefined.
    const file_s = event.target.files || undefined;
    handleFiles(file_s, setter, fileType, isSingleFile);
  }

  function handleFiles(
    files: FileList | undefined,
    setter: React.Dispatch<React.SetStateAction<FileList | File | undefined>>,
    fileType: string,
    isSingleFile: boolean = true
  ) {
    if (
      files &&
      fileType === "document" &&
      Array.from(files).every((file: File) => {
        return documentMimeTypes.includes(file.type);
      })
    ) {
      setter(isSingleFile ? files[0] : files);
    } else if (
      files &&
      fileType === "image" &&
      Array.from(files).every((file: File) => {
        return imageMimeTypes.includes(file.type);
      })
    ) {
      setter(isSingleFile ? files[0] : files);
    } else {
      setter(undefined);
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

  function fileNameHandler(name: string = "") {
    if (name.length < 13) {
      return name;
    } else {
      return name.slice(0, 10) + "...";
    }
  }

  // TO-DO write the backend logic for creating skill tree
  async function handleSubmit(
    event:
      | React.FormEvent<HTMLFormElement>
      | React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) {
    // Prevent default form submission
    event.preventDefault();
  }

  function handleOpenChange() {
    resetFields();
    dialogParameters.onClose(false);
  }

  function handleFileRemove(fileToRemove: File) {
    if (files instanceof FileList) {
      const dt = new DataTransfer();
      // Iterate over the FileList and add all files except the one to remove
      Array.from(files).forEach((file) => {
        if (file.name !== fileToRemove.name) {
          dt.items.add(file);
        }
      });

      setFiles(dt.files);
    } else {
      setFiles(undefined);
    }
  }

  return (
    <Dialog open={dialogParameters.isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="border-b-neutral-800 sm:max-w-[80vh]">
        <div className="space-y-1">
          <DialogTitle className="mb-2">Skill Tree</DialogTitle>
          <DialogDescription></DialogDescription>
          <label className="text-foreground/70 text-xs font-semibold">
            Title
          </label>
          <Input
            id="skillTreeTitle"
            type="text"
            value={skillTreeTitle}
            onChange={(event) => setSkillTreeTitle(event.target.value)}
            required
          />
          <label className="text-foreground/70 text-xs font-semibold">
            Select a chat
          </label>
          <select
            className="w-full appearance-none rounded-md border bg-black px-3 py-2 text-sm text-white"
            title="Select a chat"
            value={chat?.chat_id || ""}
            onChange={(event) => {
              const selectedId = event.target.value;
              const foundChat = availableChats.find(
                (c) => c.chat_id === selectedId
              );
              setChat(foundChat);
            }}
          >
            <option value="" disabled className="bg-black text-white">
              Choose a chat
            </option>
            {availableChats.map((c) => (
              <option
                key={c.chat_id}
                value={c.chat_id}
                className="bg-black text-white"
              >
                {c.chat_title}
              </option>
            ))}
          </select>
          <label className="text-foreground/70 text-xs font-semibold">
            Description
          </label>
          <Textarea
            id="description"
            value={skillTreeDescription}
            onChange={(event) => setSkillTreeDescription(event.target.value)}
          />
        </div>
        <div className="flex items-center space-x-4">
          <div
            className="flex w-1/2 flex-col items-center justify-center"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const files = e.dataTransfer.files;
              handleFiles(files, setFiles, "document", false);
            }}
          >
            <label
              htmlFor="files"
              className="flex h-[24vh] w-full cursor-pointer flex-col items-center justify-center overflow-y-auto rounded-lg border-2 border-dashed"
            >
              <div className="grid grid-cols-2 items-center justify-center gap-4">
                {files && (files as FileList).length > 0 ? (
                  Array.from(files as FileList).map((file) => {
                    return (
                      <div key={file.name} className="relative">
                        <button
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            handleFileRemove(file);
                          }}
                          className="absolute right-0 top-0 font-bold text-red-500"
                          aria-label="Remove file"
                          type="button"
                        >
                          X
                        </button>
                        <div className="flex flex-col items-center">
                          {file.name.endsWith(".pdf") && (
                            <FileIcon className="mb-4 size-[6vh]" />
                          )}
                          {file.name.endsWith(".docx") && (
                            <FileTextIcon className="mb-4 size-[6vh]" />
                          )}
                          <p>{fileNameHandler(file.name)}</p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-2">
                    <LuUpload className="text-foreground/70 mb-4 size-[6vh]" />
                    <p className="text-foreground/70 text-sm">
                      <span className="font-semibold">Click to upload</span> or
                      drag and drop
                    </p>
                    <p className="text-foreground/70 text-base">PDF or DOCX</p>
                  </div>
                )}
              </div>
              <input
                id="files"
                type="file"
                multiple
                accept=".pdf,.docx"
                onChange={(event) =>
                  handleFileChange(event, setFiles, "document", false)
                }
                className="hidden"
              />
            </label>
          </div>
          <div
            className="flex w-1/2 flex-col items-center justify-center"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files;
              handleFiles(file, setIcon, "image", true);
            }}
          >
            <label
              htmlFor="image"
              className="flex h-[24vh] w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed"
            >
              <div className="flex flex-col items-center justify-center">
                {icon && icon instanceof File ? (
                  <div>
                    {<ImageIcon className="mb-4 size-[6vh]" />}
                    <p>{icon.name}</p>
                  </div>
                ) : (
                  <div>
                    <LuUpload className="text-foreground/70 mb-4 size-[6vh]" />
                    <p className="text-foreground/70 text-sm">
                      <span className="font-semibold">Click to upload</span> or
                      drag and drop
                    </p>
                    <p className="text-foreground/70 text-base">
                      JPG, JPEG or PNG
                    </p>
                  </div>
                )}
              </div>
              <input
                id="image"
                type="file"
                accept=".jpg,.jpeg,.png"
                onChange={(event) => handleFileChange(event, setIcon, "image")}
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
            disabled={!skillTreeTitle || !chat}
          >
            {dialogParameters.isEdit ? "Save" : "Create"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
