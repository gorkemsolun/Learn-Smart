"use client";

import { documentMimeTypes, imageMimeTypes } from "@/app/constants";
import { Course, CourseDialogProps } from "@/app/types";
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
import { backend, backendAPI } from "@/environment/backend_api";
import { useToast } from "@/hooks/use-toast";
import { FileIcon, FileTextIcon, ImageIcon } from "@radix-ui/react-icons";
import Cookies from "js-cookie";
import * as React from "react";
import { useCallback, useEffect, useState } from "react";
import { LuUpload } from "react-icons/lu";

export function CourseDialogModal(props: CourseDialogProps) {
  const [courseName, setCourseName] = useState<string>("");
  const [courseCode, setCourseCode] = useState<string>("");
  const [courseDescription, setCourseDescription] = useState<string>("");
  const [syllabus, setSyllabus] = useState<File | null>(null);
  const [icon, setIcon] = useState<File | null>(null);
  const [disableSubmitButton, setDisableSubmitButton] =
    useState<boolean>(false);
  const [token] = useState<string>(Cookies.get("authToken") as string);
  const [originalCourseData, setOriginalCourseData] = useState<Course>();

  const { toast } = useToast();

  const resetFields = () => {
    if (!props.isCreate && originalCourseData) {
      setCourseName(originalCourseData.course_name);
      setCourseCode(originalCourseData.course_code);
      setCourseDescription(originalCourseData.course_description);
      setSyllabus(originalCourseData.course_syllabus || null);
      setIcon(originalCourseData.course_icon || null);
    }
    if (props.isCreate) {
      setCourseCode("");
      setCourseName("");
      setCourseDescription("");
      setSyllabus(null);
      setIcon(null);
    }
  };

  const fetchCourseDetails = useCallback(async () => {
    try {
      const {
        course_name = "",
        course_code = "",
        course_description = "",
        course_syllabus_url = "",
        course_icon_url = "",
      }: Course = props.course as Course;

      setCourseName(course_name);
      setCourseCode(course_code);
      setCourseDescription(course_description);

      setOriginalCourseData({
        course_name: course_name,
        course_code: course_code,
        course_description: course_description,
        course_syllabus: undefined,
        course_icon: undefined,
      });

      if (course_syllabus_url) {
        const syllabusResponse = await fetch(
          `${backend.getUri()}/${course_syllabus_url}`
        );
        const syllabusBlob = await syllabusResponse.blob();
        const syllabusType = syllabusBlob.type;
        const syllabusExtension = syllabusType.split("/")[1];
        const syllabusFile = new File(
          [syllabusBlob],
          `syllabus.${syllabusExtension}`,
          { type: syllabusType }
        );
        setSyllabus(syllabusFile);
        setOriginalCourseData((prev) => ({
          ...prev,
          course_name: prev?.course_name || "",
          course_code: prev?.course_code || "",
          course_description: prev?.course_description || "",
          syllabus: syllabusFile,
        }));
      }

      if (course_icon_url) {
        const iconResponse = await fetch(
          `${backend.getUri()}/${course_icon_url}`
        );
        const iconBlob = await iconResponse.blob();
        setOriginalCourseData((prev) => ({
          ...prev,
          course_name: prev?.course_name || "",
          course_code: prev?.course_code || "",
          course_description: prev?.course_description || "",
          course_syllabus: prev?.course_syllabus,
          course_icon: iconFile,
        }));
        const iconType = iconBlob.type;
        const iconExtension = iconType.split("/")[1];
        const iconFile = new File([iconBlob], `icon.${iconExtension}`, {
          type: iconType,
        });
        setIcon(iconFile);
        setOriginalCourseData((prev) => ({ ...prev, icon: iconFile }));
      }
      setOriginalCourseData((prev) => ({
        ...prev,
        course_name: course_name,
        course_code: course_code,
        course_description: course_description,
      }));
    } catch (error) {
      console.log(error);
      toast({
        title: "Error",
        description: "Error fetching course details",
        variant: "destructive",
        action: <ToastAction altText="Try again">Try again</ToastAction>,
      });
    }
  }, [props.course, toast]);

  useEffect(() => {
    if (!props.isCreate && props.isOpen) {
      fetchCourseDetails();
    }
  }, [fetchCourseDetails, props.isOpen, props.isCreate]);

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
    // Check if file is of correct type for document
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

  function handleOpenChange() {
    resetFields();
    props.onClose(false);
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
    if (courseDescription) {
      formData.append("course_description", courseDescription);
      if (!props.isCreate) {
        formData.append("update_description", "true");
      }
    }

    if (syllabus) {
      formData.append("course_syllabus_file", syllabus);
      if (!props.isCreate) {
        formData.append("course_update_syllabus", "true");
      }
    }
    if (icon) {
      formData.append("course_icon_file", icon);
      if (!props.isCreate) {
        formData.append("update_icon", "true");
      }
    }

    setDisableSubmitButton(true);

    if (!props.isCreate && !props.course) {
      toast({
        title: "Error",
        description: "Course data is missing",
        variant: "destructive",
        action: <ToastAction altText="Try again">Try again</ToastAction>,
      });
      return;
    }

    if (!props.isCreate) {
      await backendAPI
        .put(`/course/${props.course.course_id}`, formData, {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        })
        .then(() => {
          props.onCourseUpdate();
        })
        .catch((error) => {
          console.log(error.response);
          toast({
            title: "Error",
            description: "Error creating course" + error,
            variant: "destructive",
            action: <ToastAction altText="Try again">Try again</ToastAction>,
          });
        })
        .finally(() => {
          setDisableSubmitButton(false);
          props.onClose(false);
        });
    } else {
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
          if (props.onCourseCreation) {
            props.onCourseCreation();
          }
          toast({
            title: "Success",
            description: "Course successfully created",
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
            description: "Error creating course",
            variant: "destructive",
            action: <ToastAction altText="Try again">Try again</ToastAction>,
          });
        })
        .finally(() => {
          // Reset form fields and close the modal
          setDisableSubmitButton(false);
          resetFields();
          props.onClose(false);
        });
    }
  }

  return (
    <Dialog
      open={props.isOpen}
      onOpenChange={handleOpenChange}
      className="w-3/5"
    >
      <DialogContent className="border-b-neutral-800 sm:max-w-[80vh]">
        <div className="space-y-1">
          <DialogTitle className="mb-2">
            {props.isCreate ? "Create" : "Edit"} Individual Study
          </DialogTitle>
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
            value={courseDescription || ""}
            onChange={(event) => setCourseDescription(event.target.value)}
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
                  <div className="space-y-4">
                    {syllabus.name.endsWith(".pdf") && (
                      <FileIcon className="size-[6vh]" />
                    )}
                    {syllabus.name.endsWith(".docx") && (
                      <FileTextIcon className="size-[6vh]" />
                    )}
                    <p>{syllabus.name}</p>
                  </div>
                ) : (
                  <div>
                    <LuUpload className="mb-4 size-[6vh] text-foreground/70" />
                    <p className="text-sm text-foreground/70">
                      <span className="font-semibold">Click to upload</span> or
                      drag and drop
                    </p>
                    <p className="text-base text-foreground/70">PDF or DOCX</p>
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
                  <div className="space-y-4">
                    {<ImageIcon className="mb-4 size-[6vh]" />}
                    <p>{icon.name}</p>
                  </div>
                ) : (
                  <div>
                    <LuUpload className="mb-4 size-[6vh] text-foreground/70" />
                    <p className="text-sm text-foreground/70">
                      <span className="font-semibold">Click to upload</span> or
                      drag and drop
                    </p>
                    <p className="text-base text-foreground/70">
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
            disabled={!courseName || !courseCode || disableSubmitButton}
          >
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
