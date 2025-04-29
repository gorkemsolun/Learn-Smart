"use client";

import type { CourseCardProps } from "@/app/types";
import default_study_logo from "@/assets/default_study_logo.png";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { CourseDialogModal } from "@/components/course/course-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { filemanagerService } from "@/environment/backend_api";
import { cn } from "@/lib/utils";
import { Edit, Trash, ArrowUpRight } from "@mynaui/icons-react";
import { motion } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import Cookies from "js-cookie";

export function CourseCard(modalParameters: CourseCardProps) {
  const router = useRouter();
  const [editDialogOpen, setEditDialogOpen] = useState<boolean>(false);
  const courseIconFid = modalParameters.course.course_icon_fid || "";
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isImageLoading, setIsImageLoading] = useState<boolean>(true);
  const [imageError, setImageError] = useState<boolean>(false);
  const [token] = useState<string>(
        Cookies.get("authToken") as string
  );

  useEffect(() => {
    const fetchImageUrl = async () => {
      setIsImageLoading(true);
      setImageError(false);

      if (courseIconFid) {
        try {
          // Access the filemanager service endpoint to get the image
          const response = await filemanagerService.get(`/${courseIconFid}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          setImageUrl(response.data.file_url);
        } catch (error) {
          console.error("Error fetching course image:", error);
          setImageError(true);
        } finally {
          setIsImageLoading(false);
        }
      } else {
        setImageUrl(null);
        setIsImageLoading(false);
      }
    };

    fetchImageUrl();
  }, [courseIconFid, token]);

  const handleViewCourse = () => {
    modalParameters.startLoading?.();
    router.push(`/course/${modalParameters.course.course_id}`);
  };

  return (
    <TooltipProvider>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Card className="h-80 w-[17rem] overflow-hidden rounded-xl border bg-gradient-to-br from-card/50 to-background shadow-sm transition-all duration-300 hover:shadow-md">
          <CardHeader className="relative bg-muted/80 p-0">
            <div className="absolute left-3 top-3 z-10">
              <Badge
                variant="secondary"
                className="pointer-events-none line-clamp-1 cursor-default select-none bg-primary/90 text-xs font-thin text-primary-foreground"
              >
                {modalParameters.course.course_code}
              </Badge>
            </div>
            <div className="relative h-40 w-full overflow-hidden">
              {isImageLoading ? (
                <div className="flex size-full items-center justify-center">
                  <Skeleton className="size-32 rounded-md" />
                </div>
              ) : (
                <Image
                  src={imageError || !imageUrl ? (default_study_logo as unknown as string) : imageUrl}
                  alt={modalParameters.course.course_name}
                  width={1000}
                  height={1000}
                  className={cn(
                    "size-full object-contain transition-opacity duration-300",
                    isImageLoading ? "opacity-0" : "opacity-100",
                  )}
                  onError={() => setImageError(true)}
                  priority
                />
              )}
            </div>
          </CardHeader>

          <CardContent className="flex flex-col p-4 pt-3">
            <CardTitle className="line-clamp-1 text-lg font-thin text-foreground">
              {modalParameters.course.course_name}
            </CardTitle>
            <CardDescription
              className="mt-1.5 line-clamp-2 h-10 text-sm text-muted-foreground"
              title={modalParameters.course.course_description}
            >
              {modalParameters.course.course_description || "No description available"}
            </CardDescription>
          </CardContent>

          <CardFooter className="flex items-center justify-between p-4 pt-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="default" size="sm" className="gap-1.5" onClick={handleViewCourse}>
                  <span>View Course</span>
                  <ArrowUpRight className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Open course details</p>
              </TooltipContent>
            </Tooltip>

            <div className="flex space-x-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => setEditDialogOpen(true)}
                    aria-label="Edit course"
                  >
                    <Edit className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Edit course</p>
                </TooltipContent>
              </Tooltip>

              <ConfirmationDialog
                title="Confirm Deleting Course"
                description={`Are you sure you want to delete course "${modalParameters.course.course_name}"? This action cannot be undone.`}
                triggerButtonLabel={<Trash className="size-4" />}
                onConfirm={() => modalParameters.onCourseDelete(modalParameters.course.course_id)}
                triggerButtonProps={{
                  size: "icon",
                  variant: "outline",
                  "aria-label": "Delete course",
                }}
              />
            </div>
          </CardFooter>
        </Card>

        <CourseDialogModal
          isCreate={false}
          isOpen={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          course={modalParameters.course}
          onCourseUpdate={modalParameters.onCourseUpdate}
        />
      </motion.div>
    </TooltipProvider>
  );
}
