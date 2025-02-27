"use client";

import React, {useState} from "react";
import {Pencil1Icon} from "@radix-ui/react-icons";
import {CoursesListProps} from "@/app/types";
import {Card, CardTitle} from "@/components/ui/card";
import {CourseCard} from "@/components/course-card";
import {backendAPI} from "@/environment/backend_api";
import {ToastAction} from "@/components/ui/toast";
import {useToast} from "@/hooks/use-toast";
import Cookies from "js-cookie";
import {ScrollArea} from "@/components/ui/scroll-area";

export function CoursesList (modalParameters: CoursesListProps) {
    const [token] = useState<string>(
        Cookies.get("authToken") as string
    );
    const {toast} = useToast();
    const handleDeleteCourse = async (courseId: string) => {
        try {
          await backendAPI.delete(`/course/${courseId}`, {
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
      <Card className="h-full bg-gradient-to-br from-primary/5 via-secondary/5 to-background">
        <div className="flex items-center justify-between p-6">
          <CardTitle>Your Studies</CardTitle>
          <Pencil1Icon className="cursor-pointer items-center justify-center text-foreground hover:bg-transparent hover:text-foreground/40" onClick={ () => modalParameters.setCourseDialog(true)}/>
        </div>

        <ScrollArea className="-mt-2 h-96 w-full bg-transparent">
          <div className="p-4">
            <div className="flex flex-wrap gap-4">
            {modalParameters.courses.map((Course, index) => (
                <div
                    key={index}
                    className="flex items-center justify-between"
                >
                  <CourseCard
                      course={Course}
                      onCourseDelete={handleDeleteCourse}
                      onCourseUpdate={modalParameters.onCourseUpdate}
                  />
                </div>
            ))}
           </div>
          </div>
        </ScrollArea>
      </Card>
    );
}
