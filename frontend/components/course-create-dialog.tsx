"use client";

import {useState} from 'react';
import { documentMimeTypes, imageMimeTypes } from "@/app/constants";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button"
import Cookies from "js-cookie";
import {backendAPI} from "@/environment/backend_api";
import {CourseCreateDialogProps} from "@/app/types";
import { LuUploadCloud } from "react-icons/lu";
import { FileIcon, ImageIcon, FileTextIcon } from "@radix-ui/react-icons";
import { Textarea } from "@/components/ui/textarea"
import {useToast} from "@/hooks/use-toast";
import {ToastAction} from "@/components/ui/toast";
import * as React from "react";

export function CourseCreateDialogModal( modalParameters: CourseCreateDialogProps ) {

  const [courseName, setCourseName] = useState<string>("");
  const [courseCode, setCourseCode] = useState<string>("");
  const [courseDescription, setCourseDescription] = useState<string>("");
  const [syllabus, setSyllabus] = useState<File | null>(null);
  const [icon, setIcon] = useState<File | null>(null);
  const [disableCreateButton, setDisableCreateButton] = useState<boolean>(false);
  const [token] = useState<string>(
    Cookies.get("authToken") as string
  );

  const {toast} = useToast();
  const resetFields = () => {
    setCourseCode("");
    setCourseName("");
    setCourseDescription("");
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
    if (file && fileType === "document" && documentMimeTypes.includes(file.type)) {
      setter(file);
    } else if (file && fileType === "image" && imageMimeTypes.includes(file.type)) {
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
  async function handleSubmit(
    event:
      | React.FormEvent<HTMLFormElement>
      | React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) {
    // Prevent default form submission
    event.preventDefault();

    // Create the form data object to send to the backend
    const formData = new FormData();
    formData.append("course_name", courseName);
    formData.append("course_code", courseCode);
    formData.append("course_description", courseDescription);
    if (syllabus) {
      formData.append("course_syllabus_file", syllabus);
    }
    if (icon) {
      formData.append("course_icon_file", icon);
    }

    setDisableCreateButton(true);

    // Send the form data to the backend
    await backendAPI
      .post(`/course/create`, formData, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      })
      .then(() => {
        // Call the onCourseCreation callback to update the course list
        modalParameters.onCourseCreation();
        toast({
            title: "Success",
            description: "Course successfully created",
            variant: "default",
            action: <ToastAction altText="Dismiss" className="hover:bg-background/20">Dismiss</ToastAction>,
            className: "bg-green-500 text-background",
        });
      })
      .catch((error) => {
        console.log(error.response);
        toast({
            title: "Error",
            description: "Error creating course",
            variant: "destructive",
            action: <ToastAction altText="Try again">Try again</ToastAction>,
        });
      })
      .finally(() => {
        // Reset form fields and close the modal
        setDisableCreateButton(false);
        resetFields();
        modalParameters.onClose(false);
      });
  }

  function handleOpenChange() {
    resetFields();
    modalParameters.onClose(false);
  }

  return (
      <Dialog open={modalParameters.isOpen} onOpenChange={handleOpenChange} className="w-3/5">
        <DialogContent className="sm:max-w-[80vh] border-b-neutral-800">
          <div className="space-y-1">
            <DialogTitle className="mb-2">Create Individual Study</DialogTitle>
            <DialogDescription></DialogDescription>
            <label className="text-xs font-semibold text-foreground/70">
              Name
            </label>
            <Input
                id="courseName"
                type="text"
                value={courseName}
                onChange={(event) => setCourseName(event.target.value)}
                required
            />
            <label className="text-xs font-semibold text-foreground/70">
              Code
            </label>
            <Input
                id="courseCode"
                type="text"
                value={courseCode}
                onChange={(event) => setCourseCode(event.target.value)}
                required
            />
            <label className="text-xs font-semibold text-foreground/70">
              Description
            </label>
            <Textarea
                id="description"
                value={courseDescription}
                onChange={(event) => setCourseDescription(event.target.value)}
            />
          </div>
          <div className="flex space-x-4 items-center">
            <div
                className="flex flex-col items-center justify-center w-1/2"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files[0];
                  handleFile(file, setSyllabus, "document");
                }}
            >
              <label
                  htmlFor="syllabus"
                  className="flex flex-col items-center justify-center w-full h-[24vh] border-2 border-dashed rounded-lg cursor-pointer"
              >
                <div className="flex flex-col items-center justify-center">
                  {syllabus ? (
                      <div>
                        {syllabus.name.endsWith(".pdf") && (
                            <FileIcon className="w-[6vh] h-[6vh] mb-4"/>
                        )}
                        {syllabus.name.endsWith(".docx") && (
                            <FileTextIcon className="w-[6vh] h-[6vh] mb-4"/>
                        )}
                        <p>{syllabus.name}</p>
                      </div>
                  ) : (
                      <div>
                        <LuUploadCloud className="text-foreground/70 w-[6vh] h-[6vh] mb-4"/>
                        <p className="text-sm text-foreground/70">
                          <span className="font-semibold">Click to upload</span>{" "}
                          or drag and drop
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
                        handleFileChange(
                            event,
                            setSyllabus,
                            "document"
                        )
                    }
                    className="hidden"
                />
              </label>
            </div>
            <div
                className="flex flex-col items-center justify-center w-1/2"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files[0];
                  handleFile(file, setIcon, "image");
                }}
            >
              <label
                  htmlFor="image"
                  className="flex flex-col items-center justify-center w-full h-[24vh] border-2 border-dashed rounded-lg cursor-pointer"
              >
                <div className="flex flex-col items-center justify-center">
                  {icon ? (
                      <div>
                        {<ImageIcon className="w-[6vh] h-[6vh] mb-4"/>}
                        <p>{icon.name}</p>
                      </div>
                  ) : (
                      <div>
                        <LuUploadCloud className="text-foreground/70 w-[6vh] h-[6vh] mb-4"/>
                        <p className="text-sm text-foreground/70">
                          <span className="font-semibold">Click to upload</span>{" "}
                          or drag and drop
                        </p>
                        <p className="text-foreground/70 text-base">JPG, JPEG or PNG</p>
                      </div>
                  )}
                </div>
                <input
                    id="image"
                    type="file"
                    accept=".jpg,.jpeg,.png"
                    onChange={(event) =>
                        handleFileChange(event, setIcon, "image")
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
              disabled={!courseName || !courseCode || disableCreateButton}
            >
              Create
            </Button>
          </div>
        </DialogContent>
      </Dialog>
  );
}
