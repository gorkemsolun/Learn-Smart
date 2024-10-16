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
  const courseIconUrl = modalParameters.course.course_icon_url || "";
    const imageUrl: string = courseIconUrl
        ? `${backend.getUri()}/${courseIconUrl}?t=${Date.now()}`
        : (default_study_logo as string);
  return (
    <Card className="flex items-center justify-between p-4 w-full space-x-4 overflow-hidden h-[20vh]">
      <div className="flex items-center space-x-4">
          <div
              className="rounded-md cursor-pointer"
              onClick={() => router.push(`/course/${modalParameters.course.course_id}`)}
          >

               <Image
                    src={imageUrl}
                    alt={modalParameters.course.course_name}
                    className="object-cover object-fit rounded-md w-[12vh] h-[12vh] bg-foreground/20"
                    width={250}
                    height={250}
                    priority={true}
               />
              <div className="text-center text-sm font-medium mt-2">
                  {modalParameters.course.course_code}
              </div>
          </div>

          <CardContent className="flex flex-col">
              <CardTitle>{modalParameters.course.course_name}</CardTitle>
              <CardDescription className="flex line-clamp-3 max-w-[28lvh] overflow-x-hidden">
            {modalParameters.course.course_description}
          </CardDescription>
        </CardContent>
      </div>

      <div className="flex-shrink-0 flex space-x-2">
          <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
              <Pencil2Icon />
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
            course={modalParameters.course}
            onCourseUpdate={modalParameters.onCourseUpdate}
      />
    </Card>
  );
}
