"use client";

import { CourseCardProps } from "@/app/types";
import default_study_logo from "@/assets/default_study_logo.png";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { CourseDialogModal } from "@/components/course-dialog";
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
        className="g-gradient-to-br min-h-80 min-w-72 overflow-hidden from-primary/10 to-secondary/10
              transition-shadow duration-300 hover:shadow-lg"
      >
        <div className="group relative h-40 overflow-hidden p-2">
          <div className="absolute left-4 top-4 z-10">
            <Badge
                variant="secondary"
                className="pointer-events-none line-clamp-1
                      cursor-default select-none
                      overflow-hidden bg-foreground/20
                      text-xs
                      font-semibold
                      text-background/70"
            >
              {modalParameters.course.course_code}
            </Badge>
          </div>
          <Image
              src={image_url}
              alt={modalParameters.course.course_name}
              width={250}
              height={250}
              className="bg-foreground/10"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                justifySelf: "center",
                borderRadius: "0.75rem"
              }}
              priority
          />
        </div>
        <CardContent className="flex min-h-40 flex-col p-4">
          <CardTitle className="text-darker mb-1 line-clamp-1 block overflow-x-hidden text-lg font-semibold">
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
      <CourseDialogModal
        isCreate={false}
        isOpen={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        course={modalParameters.course}
        onCourseUpdate={modalParameters.onCourseUpdate}
      />
    </motion.div>
  );
}
