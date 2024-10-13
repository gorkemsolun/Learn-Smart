"use client";

import React, {useState} from "react";
import { TrashIcon, Pencil2Icon } from "@radix-ui/react-icons";
import { useRouter } from "next/navigation";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { CourseCardProps } from "@/app/types";
import {
    Card,
    CardContent,
    CardDescription,
    CardTitle,
} from "@/components/ui/card";
import {backend} from "@/environment/backend_api";
import default_study_logo from "@/assets/default_study_logo.png";
import Image from "next/image";
import {CourseEditDialogModal} from "@/components/course-edit-dialog";
import {Button} from "@/components/ui/button";
export function CourseCard(modalParameters: CourseCardProps) {
  const router = useRouter();
  const [editDialogOpen, setEditDialogOpen] = useState<boolean>(false);
  return (
    <Card className="flex items-center justify-between p-4 w-full space-x-4 overflow-auto">
      <div className="flex items-center space-x-4">
        <div
          className="rounded-md cursor-pointer"
          onClick={() => router.push(`/course/${modalParameters.course.course_id}`)}
        >
          {modalParameters.course.course_icon_url ? (
            <Image
              src={`${backend.getUri()}/${modalParameters.course.course_icon_url}`}
              alt={modalParameters.course.course_name}
              className="object-cover object-fit rounded-md"
              width={1000}
              height={1000}
              style={{ width: '12lvh', height: '12lvh' }}
            />
          ) : (
            <Image
              src={default_study_logo}
              alt={modalParameters.course.course_name}
              className="object-cover object-fit rounded-md bg-foreground/20"
              width={1000}
              height={1000}
              style={{ width: '12lvh', height: '12lvh' }}
            />
          )}
        </div>

        <CardContent className="flex flex-col">
          <CardTitle>{modalParameters.course.course_name}</CardTitle>
          <CardDescription className="line-clamp-3 max-w-[28lvh] overflow-x-hidden">
            {modalParameters.course.course_description}
          </CardDescription>
        </CardContent>
      </div>

      <div className="flex-shrink-0 flex space-x-2">
          <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
              <Pencil2Icon/>
          </Button>
        <ConfirmationDialog
          title="Confirm Deleting Study"
          description={`Are you sure you want to delete course ${modalParameters.course.course_name}? This action cannot be undone.`}
          triggerButtonLabel={<TrashIcon />}
          onConfirm={() => modalParameters.onCourseDelete(modalParameters.course.course_id)}
        />
      </div>
        <CourseEditDialogModal
            isOpen={editDialogOpen}
            onClose={() => setEditDialogOpen(false)}
            courseId={modalParameters.course.course_id}
            onCourseUpdate={modalParameters.onCourseUpdate}
      />
    </Card>
  );
}
