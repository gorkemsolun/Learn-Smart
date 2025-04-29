"use client";

import { documentMimeTypes, imageMimeTypes } from "@/app/constants";
import type { Course } from "@/app/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ToastAction } from "@/components/ui/toast";
import { courseService, filemanagerService } from "@/environment/backend_api";
import { useToast } from "@/hooks/use-toast";
import { FileCheck, FileText, Image } from "@mynaui/icons-react";
import Cookies from "js-cookie";
import type * as React from "react";
import { useCallback, useEffect, useRef, useState } from "react";

export function CourseDialogModal(props: {
  isCreate: boolean;
  isOpen: boolean;
  onClose: (value: boolean) => void;
  onCourseUpdate: () => void;
  onCourseCreation?: () => void;
  course: Course;
}) {
  const [courseName, setCourseName] = useState<string>("");
  const [courseCode, setCourseCode] = useState<string>("");
  const [courseDescription, setCourseDescription] = useState<string>("");
  const [syllabus, setSyllabus] = useState<File | null>(null);
  const [icon, setIcon] = useState<File | null>(null);
  const [disableSubmitButton, setDisableSubmitButton] =
    useState<boolean>(false);
  const [token] = useState<string>(Cookies.get("authToken") as string);
  const [originalCourseData, setOriginalCourseData] = useState<Course>();

  const syllabusInputRef = useRef<HTMLInputElement>(null);
  const iconInputRef = useRef<HTMLInputElement>(null);

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
        course_syllabus_fid = "",
        course_icon_fid = "",
      }: Course = props.course as Course;

      setCourseName(course_name);
      setCourseCode(course_code);
      setCourseDescription(course_description);

      let syllabusFile: File | undefined = undefined;
      let iconFile: File | undefined = undefined;

      if (course_syllabus_fid) {
        console.log("course_syllabus_fid", course_syllabus_fid);
        try {
          const response = await filemanagerService.get(
            `/${course_syllabus_fid}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          const syllabus_url = response.data.file_url;
          const syllabus_filename = response.data.file_name;
          const syllabusBlob = await (await fetch(syllabus_url)).blob();
          const syllabusExtension = syllabus_filename.split(".").pop();
          syllabusFile = new File(
            [syllabusBlob],
            `syllabus.${syllabusExtension}`,
            {
              type: syllabusBlob.type,
            }
          );
          setSyllabus(syllabusFile);
        } catch (syllabusError) {
          console.error("Error fetching syllabus file:", syllabusError);
        }
      }

      if (course_icon_fid) {
        console.log("course_icon_fid", course_icon_fid);
        try {
          const response = await filemanagerService.get(`/${course_icon_fid}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const icon_url = response.data.file_url;
          const icon_file_name = response.data.file_name;
          const iconBlob = await (await fetch(icon_url)).blob();
          const iconExtension = icon_file_name.split(".").pop();
          iconFile = new File([iconBlob], `icon.${iconExtension}`, {
            type: iconBlob.type,
          });
          setIcon(iconFile);
        } catch (iconError) {
          console.error("Error fetching icon file:", iconError);
        }
      }

      setOriginalCourseData({
        course_id: props.course?.course_id,
        course_name,
        course_code,
        course_description,
        course_syllabus: syllabusFile,
        course_icon: iconFile,
      });
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
    console.log("handleFileChange", file);
  }

  function handleFile(
    file: File | null,
    setter: React.Dispatch<React.SetStateAction<File | null>>,
    fileType: string
  ) {
    console.log("handleFile", file, fileType);

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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
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
    } else if (!props.isCreate && originalCourseData?.course_syllabus) {
      formData.append("course_update_syllabus", "true");
    }

    if (icon) {
      formData.append("course_icon_file", icon);
      if (!props.isCreate) {
        formData.append("update_icon", "true");
      }
    } else if (!props.isCreate && originalCourseData?.course_icon) {
      formData.append("update_icon", "true");
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

    try {
      if (!props.isCreate) {
        const response = await courseService.put(
          `/${props.course?.course_id}`,
          formData,
          {
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );

        console.log("response", response.data);

        props.onCourseUpdate();
        toast({
          title: "Success",
          description: "Course successfully updated",
          variant: "default",
          action: (
            <ToastAction altText="Dismiss" className="hover:bg-background/20">
              Dismiss
            </ToastAction>
          ),
          className: "bg-green-500 text-background",
        });
      } else {
        // Send the form data to the backend
        await courseService.post(`/create`, formData, {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });

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
      }
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: `Error ${props.isCreate ? "creating" : "updating"} course`,
        variant: "destructive",
        action: <ToastAction altText="Try again">Try again</ToastAction>,
      });
    } finally {
      // Reset form fields and close the modal
      setDisableSubmitButton(false);
      resetFields();
      props.onClose(false);
    }
  }

  return (
    <Dialog open={props.isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[650px]">
        <DialogHeader>
          <DialogTitle>
            {props.isCreate ? "Create" : "Edit"} Individual Study
          </DialogTitle>
        </DialogHeader>

        <form className="space-y-2 py-2" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="courseName" className="text-sm font-medium">
                Name
              </Label>
              <Input
                id="courseName"
                type="text"
                value={courseName}
                onChange={(event) => setCourseName(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="courseCode" className="text-sm font-medium">
                Code
              </Label>
              <Input
                id="courseCode"
                type="text"
                value={courseCode}
                onChange={(event) => setCourseCode(event.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Description
            </Label>
            <Textarea
              id="description"
              value={courseDescription || ""}
              onChange={(event) => setCourseDescription(event.target.value)}
              placeholder="Enter course description"
              className="min-h-[100px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="syllabus" className="text-sm font-medium">
                Syllabus (PDF or DOCX)
              </Label>
              <div
                className="border-muted-foreground/25 hover:border-muted-foreground/50 flex flex-col items-center justify-center rounded-md border-2 border-dashed p-6 transition-colors"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files[0];
                  handleFile(file, setSyllabus, "document");
                }}
              >
                {syllabus ? (
                  <div className="flex flex-col items-center text-center">
                    {syllabus.name.endsWith(".pdf") ? (
                      <div className="bg-primary/10 mb-2 rounded-full p-2">
                        <FileCheck
                          className="text-primary size-6"
                          aria-hidden="true"
                        />
                      </div>
                    ) : (
                      <div className="bg-primary/10 mb-2 rounded-full p-2">
                        <FileText
                          className="text-primary size-6"
                          aria-hidden="true"
                        />
                      </div>
                    )}
                    <p className="text-sm font-medium">{syllabus.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {(syllabus.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => {
                        setSyllabus(null);
                        if (syllabusInputRef.current) {
                          syllabusInputRef.current.value = "";
                        }
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <label
                    htmlFor="syllabus"
                    className="flex cursor-pointer flex-col items-center text-center"
                  >
                    <div className="bg-primary/10 mb-2 rounded-full p-2">
                      <FileText className="text-primary size-6" />
                    </div>
                    <p className="text-sm font-light">
                      <span className="text-primary">Click to upload</span> or
                      drag and drop
                    </p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      PDF or DOCX (max 10MB)
                    </p>
                  </label>
                )}
                <input
                  id="syllabus"
                  type="file"
                  accept=".pdf,.docx"
                  onChange={(event) =>
                    handleFileChange(event, setSyllabus, "document")
                  }
                  className="hidden"
                  ref={syllabusInputRef}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="image" className="text-sm font-medium">
                Course Icon (JPG, JPEG or PNG)
              </Label>
              <div
                className="border-muted-foreground/25 hover:border-muted-foreground/50 flex flex-col items-center justify-center rounded-md border-2 border-dashed p-6 transition-colors"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files[0];
                  handleFile(file, setIcon, "image");
                }}
              >
                {icon ? (
                  <div className="flex flex-col items-center text-center">
                    <div className="bg-primary/10 mb-2 rounded-full p-2">
                      <Image className="text-primary size-6" />
                    </div>
                    <p className="text-sm font-medium">{icon.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {(icon.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => {
                        setIcon(null);
                        if (iconInputRef.current) {
                          iconInputRef.current.value = "";
                        }
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <label
                    htmlFor="image"
                    className="flex cursor-pointer flex-col items-center text-center"
                  >
                    <div className="bg-primary/10 mb-2 rounded-full p-2">
                      <Image className="text-primary size-6" />
                    </div>
                    <p className="text-sm font-light">
                      <span className="text-primary">Click to upload</span> or
                      drag and drop
                    </p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      JPG, JPEG or PNG (max 10MB)
                    </p>
                  </label>
                )}
                <input
                  id="image"
                  type="file"
                  accept=".jpg,.jpeg,.png"
                  onChange={(event) =>
                    handleFileChange(event, setIcon, "image")
                  }
                  className="hidden"
                  ref={iconInputRef}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleOpenChange}
              className="mt-2"
            >
              Cancel
            </Button>
            <Button
              className="mt-2"
              type="submit"
              disabled={!courseName || !courseCode || disableSubmitButton}
            >
              {disableSubmitButton
                ? props.isCreate
                  ? "Creating..."
                  : "Updating..."
                : props.isCreate
                  ? "Create"
                  : "Update"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
