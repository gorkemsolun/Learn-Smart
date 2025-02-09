"use client";

import { documentMimeTypes, imageMimeTypes } from "@/app/constants";
import { SkillTreeEditDialogProps } from "@/app/types";
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

export function SkillTreeEditDialogModal(
  dialogParameters: SkillTreeEditDialogProps
) {
  const [skillTreeTitle, setSkillTreeTitle] = useState<string>("");
  const [keywords, setKeywords] = useState<string>("");
  const [skillTreeDescription, setSkillTreeDescription] = useState<string>("");
  const [syllabus, setSyllabus] = useState<File | null>(null);
  const [icon, setIcon] = useState<File | null>(null);
  const [disableCreateButton, setDisableCreateButton] =
    useState<boolean>(false);

  const { toast } = useToast();
  const resetFields = () => {
    setKeywords("");
    setSkillTreeTitle("");
    setSkillTreeDescription("");
    setSyllabus(null);
    setIcon(null);
  };

  function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<File | null>>,
    fileType: string
  ) {
    const file = event.target.files && event.target.files[0];
    handleFile(file, setter, fileType);
  }

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

  return (
    <Dialog
      open={dialogParameters.isOpen}
      onOpenChange={handleOpenChange}
      className="w-3/5"
    >
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
            Keywords
          </label>
          <Input
            id="keywords"
            type="text"
            value={keywords}
            onChange={(event) => setKeywords(event.target.value)}
            required
          />
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
              const file = e.dataTransfer.files[0];
              handleFile(file, setSyllabus, "document");
            }}
          >
            <label
              htmlFor="syllabus"
              className="flex h-[24vh] w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed"
            >
              <div className="flex flex-col items-center justify-center">
                {syllabus ? (
                  <div>
                    {syllabus.name.endsWith(".pdf") && (
                      <FileIcon className="mb-4 size-[6vh]" />
                    )}
                    {syllabus.name.endsWith(".docx") && (
                      <FileTextIcon className="mb-4 size-[6vh]" />
                    )}
                    <p>{syllabus.name}</p>
                  </div>
                ) : (
                  <div>
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
                id="syllabus"
                type="file"
                accept=".pdf,.docx"
                onChange={(event) =>
                  handleFileChange(event, setSyllabus, "document")
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
              const file = e.dataTransfer.files[0];
              handleFile(file, setIcon, "image");
            }}
          >
            <label
              htmlFor="image"
              className="flex h-[24vh] w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed"
            >
              <div className="flex flex-col items-center justify-center">
                {icon ? (
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
            disabled={!skillTreeTitle || !keywords || disableCreateButton}
          >
            Create
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
