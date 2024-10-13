"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { PlusCircledIcon } from "@radix-ui/react-icons";
import {CoursesListProps} from "@/app/types";
import {Card, CardTitle} from "@/components/ui/card";
import {CourseCard} from "@/components/course-card";
export function CoursesList (modalParameters: CoursesListProps) {
  return (
      <Card className="col-span-2">
        <div className="flex items-center justify-between p-6">
          <CardTitle>Your Studies</CardTitle>
          <Button
              className="bg-none bg-transparent shadow-none hover:text-foreground/40 hover:bg-transparent text-foreground flex items-center"
              onClick={ () => modalParameters.setCourseDialog(true)}>
            <PlusCircledIcon/>
          </Button>
        </div>

        <div className="items-center h-[45lvh] overflow-auto px-6">
          <div className="space-y-4">
            {modalParameters.courses.map((Course, index) => (
                <div
                    key={index}
                    className="flex justify-between items-center"
                >
                  <CourseCard course={Course} onCourseDelete={modalParameters.onCourseDelete}
                              onCourseUpdate={modalParameters.onCourseUpdate}/>
                </div>
            ))}
          </div>
        </div>
      </Card>
  );
}
