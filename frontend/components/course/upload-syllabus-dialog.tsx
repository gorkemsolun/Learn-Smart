"use client";

import type React from "react";
import { useState } from "react";
import { FileIcon, FileTextIcon, Upload, X, Eye, AlertCircle } from 'lucide-react';
import Cookies from "js-cookie";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { backend, backendAPI } from "@/environment/backend_api";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Updated MIME types
const documentMimeTypes = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const validExtensions = ["pdf", "docx"];

interface UpdateUploadSyllabusParameters {
  isOpen: boolean;
  modalTitle: string;
  onClose: () => void;
  course_id: string;
  onUploadSuccess?: () => void;
  existingSyllabus?: {
    url?: string;
    name?: string;
  };
}

export default function UpdateUploadSyllabus({
  isOpen,
  modalTitle,
  onClose,
  course_id,
  onUploadSuccess,
  existingSyllabus,
}: UpdateUploadSyllabusParameters) {
  const [syllabus, setSyllabus] = useState<File | null>(null);
  const [syllabusError, setSyllabusError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReplacing, setIsReplacing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const resetFields = () => {
    setSyllabus(null);
    setSyllabusError("");
    setIsReplacing(false);
    setUploadProgress(0);
    setIsDragging(false);
  };

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files && event.target.files[0];
    handleFile(file);
  }

  function handleFile(file: File | null) {
    if (file) {
      const fileExtension = file.name.split(".").pop()?.toLowerCase() || "";
      const isValidFileType =
        documentMimeTypes.includes(file.type) || validExtensions.includes(fileExtension);

      if (!isValidFileType) {
        setSyllabus(null);
        setSyllabusError("Invalid file type. Allowed types are: PDF, DOCX");
        return;
      }

      setSyllabus(file);
      setSyllabusError("");
    } else {
      setSyllabus(null);
    }
  }

  function handleDragOver(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave() {
    setIsDragging(false);
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files[0] || null;
    handleFile(file);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!syllabus) {
      setSyllabusError("Please upload a syllabus file.");
      return;
    }

    const token = Cookies.get("authToken") || "";
    const formData = new FormData();
    formData.append("course_syllabus_file", syllabus);
    formData.append("course_update_syllabus", "true");

    setIsSubmitting(true);
    setUploadProgress(10);

    try {
      await backendAPI.put(`/course/${course_id}`, formData, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        },
      });

      setUploadProgress(100);

      await new Promise((resolve) => setTimeout(resolve, 500));

      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (error) {
      console.error("Error uploading syllabus:", error);
      setSyllabusError(`An unexpected error occurred. Please try again.`);
      setUploadProgress(0);
    } finally {
      setIsSubmitting(false);
    }
  }

  const closeModal = () => {
    resetFields();
    onClose();
  };

  const hasExistingSyllabus = !!existingSyllabus?.url;
  const fileExtension = syllabus?.name.split(".").pop()?.toLowerCase() || "";

  const getFileIcon = (ext: string) => {
    switch (ext) {
      case "pdf":
        return <FileIcon className="size-10 text-primary" />;
      case "docx":
        return <FileTextIcon className="size-10 text-primary" />;
      default:
        return <FileTextIcon className="size-10 text-primary" />;
    }
  };

  const fileIcon = getFileIcon(fileExtension);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeModal()}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>{modalTitle}</DialogTitle>
          <DialogDescription className="font-light">
            {hasExistingSyllabus
              ? "Update your course syllabus to refresh your personalized weekly study plan."
              : "Upload your course syllabus to get a personalized weekly study plan."}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-6 py-2" onSubmit={handleSubmit}>
          {hasExistingSyllabus && !syllabus && !isReplacing && (
            <div className="rounded-md border border-border bg-muted/30 p-4">
              <h3 className="mb-2 text-sm font-medium">Current Syllabus</h3>
              <div className="flex items-start space-x-3">
                <div className="rounded-full bg-primary/10 p-2">
                  <FileIcon className="size-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{existingSyllabus.name || "Course Syllabus"}</p>
                  <div className="mt-1 flex items-center space-x-2">
                    {existingSyllabus.url && (
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-xs font-light"
                        onClick={() => window.open(`${backend.getUri()}/${existingSyllabus.url}`, "_blank")}
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

          <div className="space-y-2">
            <Label htmlFor="syllabus" className="text-sm font-medium">
              {hasExistingSyllabus && !isReplacing ? "Upload New Syllabus" : "Upload Syllabus"}
            </Label>
            <div
              className={`flex flex-col items-center justify-center rounded-md border-2 border-dashed p-6 transition-colors ${
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-muted-foreground/50"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {syllabus ? (
                <div className="flex flex-col items-center text-center">
                  {fileIcon}
                  <p className="mt-2 text-sm font-medium">{syllabus.name}</p>
                  <p className="text-xs font-light text-muted-foreground">
                    {(syllabus.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-3 flex items-center gap-1"
                    onClick={() => setSyllabus(null)}
                  >
                    <X className="size-3" />
                    Remove
                  </Button>
                </div>
              ) : (
                <label
                  htmlFor="syllabus-upload"
                  className="flex cursor-pointer flex-col items-center text-center"
                >
                  <div className="mb-3 rounded-full bg-primary/10 p-3">
                    <Upload className="size-6 text-primary" />
                  </div>
                  <p className="text-sm font-medium">
                    <span className="text-primary">Click to upload</span> or drag and drop
                  </p>
                  <p className="mt-1 text-xs font-light text-muted-foreground">PDF or DOCX (max 10MB)</p>
                </label>
              )}
              <input
                id="syllabus-upload"
                type="file"
                accept=".pdf,.docx"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {syllabusError && (
              <Alert variant="destructive" className="mt-2 py-2">
                <AlertCircle className="size-4" />
                <AlertDescription className="ml-2 text-xs">{syllabusError}</AlertDescription>
              </Alert>
            )}
          </div>

          {isSubmitting && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">Uploading...</span>
                <span className="text-xs font-light text-muted-foreground">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeModal} className="mr-2">
              Cancel
            </Button>
            <Button type="submit" disabled={syllabus === null || isSubmitting} className="min-w-24">
              {isSubmitting ? "Uploading..." : hasExistingSyllabus ? "Update" : "Upload"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
