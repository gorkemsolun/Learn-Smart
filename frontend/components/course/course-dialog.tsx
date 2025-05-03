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
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { ToastAction } from "@/components/ui/toast";
import { courseService, filemanagerService } from "@/environment/backend_api";
import { useToast } from "@/hooks/use-toast";
import { useCheckCourseCode } from "@/hooks/useCheckCourseCode";
import {
  Eye,
  FileCheck,
  FileText,
  Image,
  Upload,
  X,
} from "@mynaui/icons-react";
import Cookies from "js-cookie";
import type * as React from "react";
import { useCallback, useEffect, useRef, useState } from "react";

export function CourseDialogModal({
  isCreate,
  isOpen,
  onClose,
  onCourseUpdate,
  onCourseCreation,
  course,
  isFromSyllabusPage,
}: {
  isCreate: boolean;
  isOpen: boolean;
  onClose: (value: boolean) => void;
  onCourseUpdate: () => void;
  onCourseCreation?: () => void;
  course?: Course;
  isFromSyllabusPage?: boolean;
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

  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [hasExistingSyllabus, setHasExistingSyllabus] =
    useState<boolean>(false);
  const [existingSyllabus, setExistingSyllabus] = useState<{
    name: string;
    url: string | null;
  }>({
    name: "",
    url: null,
  });

  const { toast } = useToast();
  const { checkCourseCode } = useCheckCourseCode();

  const resetFields = () => {
    if (!isCreate && originalCourseData) {
      setCourseName(originalCourseData.course_name);
      setCourseCode(originalCourseData.course_code);
      setCourseDescription(originalCourseData.course_description);
      setSyllabus(originalCourseData.course_syllabus || null);
      setIcon(originalCourseData.course_icon || null);
    }
    if (isCreate) {
      setCourseCode("");
      setCourseName("");
      setCourseDescription("");
      setSyllabus(null);
      setIcon(null);
    }
    setUploadProgress(0);
    setIsDragging(false);
  };

  const fetchCourseDetails = useCallback(async () => {
    if (!course) {
      return;
    }
    try {
      const {
        course_name = "",
        course_code = "",
        course_description = "",
        course_syllabus_fid = "",
        course_icon_fid = "",
      }: Course = course as Course;

      setCourseName(course_name);
      setCourseCode(course_code);
      setCourseDescription(course_description ?? "");

      let syllabusFile: File | undefined = undefined;
      let iconFile: File | undefined = undefined;

      if (course_syllabus_fid) {
        try {
          const response = await filemanagerService.get(
            `/${course_syllabus_fid}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          const syllabus_url = response.data.file_url;
          const syllabus_filename = response.data.file_name;

          setHasExistingSyllabus(true);
          setExistingSyllabus({
            name: syllabus_filename,
            url: syllabus_url,
          });

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
        course_id: course?.course_id,
        course_name,
        course_code,
        course_description,
        course_syllabus: syllabusFile,
        course_icon: iconFile,
      });
    } catch (error) {
      console.error("Error fetching course details:", error);
      toast({
        title: "Error",
        description: "Error fetching course details",
        variant: "destructive",
        action: <ToastAction altText="Try again">Try again</ToastAction>,
      });
    }
  }, [course, toast]);

  useEffect(() => {
    if (!isCreate && isOpen) {
      fetchCourseDetails();
    }
  }, [fetchCourseDetails, isOpen, isCreate]);

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

  function handleOpenChange() {
    resetFields();
    onClose(false);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // Client-side length validation
    if (courseName.length > 256) {
      toast({
        title: "Name too long",
        description: "Max length is 256 characters",
        variant: "destructive",
      });
      return;
    }
    if (courseCode.length > 16) {
      toast({
        title: "Code too long",
        description: "Max length is 16 characters",
        variant: "destructive",
      });
      return;
    }
    if (courseDescription.length > 1024) {
      toast({
        title: "Description too long",
        description: "Max length is 1024 characters",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append("course_name", courseName);
    formData.append("course_code", courseCode);
    if (courseDescription) {
      formData.append("course_description", courseDescription);
      if (!isCreate) {
        formData.append("update_description", "true");
      }
    }

    if (syllabus) {
      formData.append("course_syllabus_file", syllabus);
      if (!isCreate) {
        formData.append("course_update_syllabus", "true");
      }
    } else if (!isCreate && originalCourseData?.course_syllabus) {
      formData.append("course_update_syllabus", "true");
    }

    if (icon) {
      formData.append("course_icon_file", icon);
      if (!isCreate) {
        formData.append("update_icon", "true");
      }
    } else if (!isCreate && originalCourseData?.course_icon) {
      formData.append("update_icon", "true");
    }

    setDisableSubmitButton(true);
    setUploadProgress(10);

    if (!isCreate && !course) {
      toast({
        title: "Error",
        description: "Course data is missing",
        variant: "destructive",
        action: <ToastAction altText="Try again">Try again</ToastAction>,
      });
      return;
    }

    try {
      if (!isCreate) {
        await courseService.put(`/${course?.course_id}`, formData, {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              setUploadProgress(percentCompleted);
            }
          },
        });

        setUploadProgress(100);
        await new Promise((resolve) => setTimeout(resolve, 300));

        onCourseUpdate();
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
        // Prevent course code duplication
        const isValid = await checkCourseCode(
          formData.get("course_code") as string
        );
        if (!isValid) return;

        // Send the form data to the backend
        await courseService.post(`/create`, formData, {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              setUploadProgress(percentCompleted);
            }
          },
        });

        setUploadProgress(100);
        await new Promise((resolve) => setTimeout(resolve, 300));

        // Call the onCourseCreation callback to update the course list
        if (onCourseCreation) {
          onCourseCreation();
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
        description: `Error ${isCreate ? "creating" : "updating"} course: ${error.response.data.detail}`,
        variant: "destructive",
        action: <ToastAction altText="Try again">Try again</ToastAction>,
      });
      setUploadProgress(0);
    } finally {
      // Reset form fields and close the modal
      setDisableSubmitButton(false);
      resetFields();
      onClose(false);
    }
  }

  const handleDragOver = (
    e: React.DragEvent<HTMLDivElement>,
    fileType: string
  ) => {
    e.preventDefault();
    e.stopPropagation();
    if (fileType === "document" || fileType === "image") {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (
    e: React.DragEvent<HTMLDivElement>,
    setter: React.Dispatch<React.SetStateAction<File | null>>,
    fileType: string
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0], setter, fileType);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className={"sm:max-w-[650px]"}>
        <DialogHeader>
          <DialogTitle>
            {!isFromSyllabusPage
              ? isCreate
                ? "Create Course"
                : "Edit Course"
              : "Edit Syllabus"}
          </DialogTitle>
        </DialogHeader>

        <form className="space-y-2 py-2" onSubmit={handleSubmit}>
          {hasExistingSyllabus && isFromSyllabusPage && (
            <div className="border-border bg-muted/30 rounded-md border p-4">
              <h3 className="mb-2 text-sm font-medium">Current Syllabus</h3>
              <div className="flex items-start space-x-3">
                <div className="bg-primary/10 rounded-full p-2">
                  <FileText className="text-primary size-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {existingSyllabus.name || "Course Syllabus"}
                  </p>
                  <div className="mt-1 flex items-center space-x-2">
                    {existingSyllabus.url && (
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-xs font-light"
                        onClick={() =>
                          window.open(existingSyllabus?.url, "_blank")
                        }
                      >
                        <Eye className="mr-1 size-3" />
                        View syllabus
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          {!isFromSyllabusPage && (
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
                  maxLength={256}
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
                  onChange={(e) => setCourseCode(e.target.value)}
                  maxLength={16}
                  required
                />
              </div>
            </div>
          )}

          {!isFromSyllabusPage && (
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                Description
              </Label>
              <Textarea
                id="description"
                value={courseDescription ?? ""}
                onChange={(e) => setCourseDescription(e.target.value)}
                placeholder="Enter course description"
                className="min-h-[100px]"
                maxLength={1024}
              />
            </div>
          )}

          <div
            className={`${!isFromSyllabusPage ? "grid grid-cols-2 gap-4" : ""}`}
          >
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Syllabus (PDF or DOCX)
              </Label>
              <div
                className={`flex flex-col items-center justify-center rounded-md border-2 border-dashed ${isDragging ? "border-primary" : "border-muted-foreground/25"} hover:border-muted-foreground/50 p-6 transition-colors`}
                onDragOver={(e) => handleDragOver(e, "document")}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, setSyllabus, "document")}
              >
                {syllabus ? (
                  <div className="flex flex-col items-center text-center">
                    <div className="bg-primary/10 mb-2 rounded-full p-2">
                      <FileCheck
                        className="text-primary size-6"
                        aria-hidden="true"
                      />
                    </div>
                    <p className="text-sm font-medium">{syllabus.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {(syllabus.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-2 flex items-center gap-1"
                      onClick={() => {
                        setSyllabus(null);
                        if (syllabusInputRef.current) {
                          syllabusInputRef.current.value = "";
                        }
                      }}
                    >
                      <X className="size-3" />
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div
                    className="flex cursor-pointer flex-col items-center text-center"
                    onClick={() => syllabusInputRef.current?.click()}
                  >
                    <div className="bg-primary/10 mb-2 rounded-full p-2">
                      <FileText className="text-primary size-6" />
                    </div>
                    <p className="text-sm font-medium">
                      <span className="text-primary">Click to upload</span> or
                      drag and drop
                    </p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      PDF or DOCX (max 10MB)
                    </p>
                  </div>
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

            {!isFromSyllabusPage && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Course Icon (JPG, JPEG or PNG)
                </Label>
                <div
                  className={`flex flex-col items-center justify-center rounded-md border-2 border-dashed ${isDragging ? "border-primary" : "border-muted-foreground/25"} hover:border-muted-foreground/50 p-6 transition-colors`}
                  onDragOver={(e) => handleDragOver(e, "image")}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, setIcon, "image")}
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
                        className="mt-2 flex items-center gap-1"
                        onClick={() => {
                          setIcon(null);
                          if (iconInputRef.current) {
                            iconInputRef.current.value = "";
                          }
                        }}
                      >
                        <X className="size-3" />
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div
                      className="flex cursor-pointer flex-col items-center text-center"
                      onClick={() => iconInputRef.current?.click()}
                    >
                      <div className="bg-primary/10 mb-2 rounded-full p-2">
                        <Upload className="text-primary size-6" />
                      </div>
                      <p className="text-sm font-medium">
                        <span className="text-primary">Click to upload</span> or
                        drag and drop
                      </p>
                      <p className="text-muted-foreground mt-1 text-xs font-light">
                        JPG, JPEG or PNG (max 10MB)
                      </p>
                    </div>
                  )}
                  <input
                    id="image"
                    type="file"
                    accept=".jpg,.jpeg,.png"
                    className="hidden"
                    ref={iconInputRef}
                    onChange={(e) => handleFileChange(e, setIcon, "image")}
                  />
                </div>
              </div>
            )}
          </div>
          {disableSubmitButton && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">Uploading...</span>
                <span className="text-muted-foreground text-xs font-light">
                  {uploadProgress}%
                </span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}
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
                ? isCreate
                  ? "Creating..."
                  : "Updating..."
                : isCreate
                  ? "Create"
                  : "Update"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
