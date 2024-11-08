"use client";

import { CourseCardProps } from "@/app/types";
import default_study_logo from "@/assets/default_study_logo.png";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { CourseEditDialogModal } from "@/components/course-edit-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { backend } from "@/environment/backend_api";
import { Pencil2Icon, TrashIcon } from "@radix-ui/react-icons";
import { motion } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function CourseCard(modalParameters: CourseCardProps) {
  const router = useRouter();
  const [editDialogOpen, setEditDialogOpen] = useState<boolean>(false);
  const courseIconUrl = modalParameters.course.course_icon_url || "";
  const image_url: string = courseIconUrl
    ? `${backend.getUri()}/${courseIconUrl}?t=${Date.now()}`
    : (default_study_logo as string);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card
        className="g-gradient-to-br h-[40vh] w-[36vh] overflow-hidden from-primary/10 to-secondary/10
              transition-shadow duration-300 hover:shadow-lg"
      >
        <div className="group relative h-[20vh] overflow-hidden">
          <Image
            src={image_url}
            alt={modalParameters.course.course_name}
            width={250}
            height={250}
            className="bg-foreground/10"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            priority
          />
          <div className="absolute inset-0 bg-black/30 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          <div className="absolute left-2 top-2 z-10">
            <Badge
              variant="secondary"
              className="pointer-events-none line-clamp-1 cursor-default select-none
                      overflow-hidden bg-background/40 text-xs
                      font-semibold"
            >
              {modalParameters.course.course_code}
            </Badge>
          </div>
        </div>
        <CardContent className="flex h-[20vh] flex-col p-4">
          <CardTitle className="mb-2 line-clamp-1 overflow-hidden text-lg font-bold">
            {modalParameters.course.course_name}
          </CardTitle>
          <CardDescription
            className="line-clamp-1 flex-1 grow overflow-hidden text-sm"
            title={modalParameters.course.course_description}
          >
            {modalParameters.course.course_description}
          </CardDescription>
          <div className="mt-4 flex items-center justify-between">
            <Button
              variant="ghost"
              className="hover:text-primary-dark text-primary transition-colors"
              onClick={() =>
                router.push(`/course/${modalParameters.course.course_id}`)
              }
            >
              View Course
            </Button>
            <div className="flex space-x-2">
              <Button
                size="icon"
                variant="outline"
                onClick={() => setEditDialogOpen(true)}
              >
                <Pencil2Icon />
              </Button>
              <ConfirmationDialog
                title="Confirm Deleting Study"
                description={`Are you sure you want to delete course ${modalParameters.course.course_name}? This action cannot be undone.`}
                triggerButtonLabel={<TrashIcon />}
                onConfirm={() =>
                  modalParameters.onCourseDelete(
                    modalParameters.course.course_id
                  )
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>
      <CourseEditDialogModal
        isOpen={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        course={modalParameters.course}
        onCourseUpdate={modalParameters.onCourseUpdate}
      />
    </motion.div>
  );
}
