"use client";

import React, {useState} from "react";
import { TrashIcon, Pencil2Icon } from "@radix-ui/react-icons";
import { motion } from 'framer-motion'
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
import { Badge } from "@/components/ui/badge"
import {Button} from "@/components/ui/button";
export function CourseCard(modalParameters: CourseCardProps) {
  const router = useRouter();
  const [editDialogOpen, setEditDialogOpen] = useState<boolean>(false);
  const courseIconUrl = modalParameters.course.course_icon_url || "";
  const image_url: string = courseIconUrl
    ? `${backend.getUri()}/${courseIconUrl}?t=${Date.now()}`
    : (default_study_logo as string);
  return (
      <motion.div
          initial={{opacity: 0, y: 20}}
          animate={{opacity: 1, y: 0}}
          transition={{duration: 0.5}}
      >
          <Card
              className="overflow-hidden w-[36.7vh] h-[40vh] g-gradient-to-br from-primary/10 to-secondary/10
              hover:shadow-lg transition-shadow duration-300">
              <div className="relative h-[20vh] overflow-hidden group">
                  <Image
                      src={image_url}
                      alt={modalParameters.course.course_name}
                      width={250}
                      height={250}
                      style={{width: '100%', height: '100%', objectFit: 'cover'}}
                      priority
                  />
                 <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute top-2 left-2 z-10">
                      <Badge variant="secondary" className="text-xs font-semibold overflow-hidden line-clamp-1
                      cursor-default pointer-events-none select-none">
                          {modalParameters.course.course_code}
                      </Badge>
                  </div>
              </div>
              <CardContent className="p-4 flex flex-col h-[20vh]">
                  <CardTitle className="text-lg font-bold mb-2 overflow-hidden line-clamp-1">
                      {modalParameters.course.course_name}
                  </CardTitle>
                  <CardDescription
                      className="text-sm overflow-hidden flex-1 flex-grow line-clamp-1"
                      title={modalParameters.course.course_description}
                  >
                      {modalParameters.course.course_description}
                  </CardDescription>
                  <div className="flex justify-between items-center mt-4">
                      <Button
                          variant="ghost"
                          className="text-primary hover:text-primary-dark transition-colors"
                          onClick={() => router.push(`/course/${modalParameters.course.course_id}`)}
                      >
                          View Course
                      </Button>
                      <div className="flex space-x-2">
                          <Button
                              size="icon"
                              variant="outline"
                              onClick={() => setEditDialogOpen(true)}
                          >
                              <Pencil2Icon/>
                          </Button>
                          <ConfirmationDialog
                              title="Confirm Deleting Study"
                              description={`Are you sure you want to delete course ${modalParameters.course.course_name}? This action cannot be undone.`}
                              triggerButtonLabel={<TrashIcon/>}
                              onConfirm={() => modalParameters.onCourseDelete(modalParameters.course.course_id)}
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
