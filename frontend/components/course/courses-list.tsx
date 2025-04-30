"use client";

import { Course } from "@/app/types";
import { CourseCard } from "@/components/course/course-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ToastAction } from "@/components/ui/toast";
import { courseService } from "@/environment/backend_api";
import { useToast } from "@/hooks/use-toast";
import Cookies from "js-cookie";
import { PlusIcon } from "lucide-react";
import { useState } from "react";

export function CoursesList(modalParameters: {
  courses: Course[];
  onCourseDelete: () => void;
  setCourseDialog: (value: boolean) => void;
  onCourseUpdate: () => void;
  startLoading?: () => void;
  stopLoading?: () => void;
}) {
  const [token] = useState<string>(Cookies.get("authToken") as string);
  const { toast } = useToast();

  const handleDeleteCourse = async (courseId: string) => {
    try {
      await courseService.delete(`/${courseId}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      modalParameters.onCourseDelete();
    } catch (error) {
      toast({
        title: "Error",
        description: "Error deleting course:" + error,
        variant: "destructive",
        action: <ToastAction altText="Try again">Try again</ToastAction>,
      });
    }
  };

  return (
    <>
      <Card className="h-full bg-gradient-to-br from-primary/5 via-secondary/5 to-background shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="font-semibold">Your Studies</CardTitle>
          <Button
            onClick={() => modalParameters.setCourseDialog(true)}
            variant="outline"
            size="sm"
            className="gap-1 hover:bg-primary/10"
          >
            <PlusIcon className="size-4" />
            <span className="hidden sm:inline">New Course</span>
          </Button>
        </CardHeader>

        <CardContent className="p-0">
          <ScrollArea className="-mt-2 h-[47vh] w-full bg-transparent">
            <div className="p-4">
              <div className="flex flex-wrap gap-6">
                {modalParameters.courses.map((Course, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between"
                  >
                    <CourseCard
                      course={Course}
                      onCourseDelete={handleDeleteCourse}
                      onCourseUpdate={modalParameters.onCourseUpdate}
                      startLoading={modalParameters.startLoading}
                      stopLoading={modalParameters.stopLoading}
                    />
                  </div>
                ))}
              </div>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </>
  );
}
