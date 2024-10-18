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

export function CoursesCreateList (modalParameters: CoursesListProps) {
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
      <Card className="col-span-3">
        <div className="flex items-center justify-between p-6">
          <CardTitle>Your Studies</CardTitle>
          <Pencil1Icon className="cursor-pointer hover:text-foreground/40 hover:bg-transparent text-foreground items-center justify-center" onClick={ () => modalParameters.setCourseDialog(true)}/>
        </div>

        <ScrollArea className="h-[45vh] w-full bg-transparent">
          <div className="p-6">
            <div className="flex flex-wrap gap-6">
            {modalParameters.courses.map((Course, index) => (
                <div
                    key={index}
                    className="flex justify-between items-center"
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
