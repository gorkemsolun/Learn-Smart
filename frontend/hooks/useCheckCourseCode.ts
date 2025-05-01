"use client";

import { Course } from "@/app/types";
import { userService } from "@/environment/backend_api";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import Cookies from "js-cookie";

export function useCheckCourseCode() {
  const { toast } = useToast();
  const [token] = useState<string>(Cookies.get("authToken") as string);
  const checkCourseCode = async (courseCode: string | null) => {
    if (!courseCode) {
      toast({
        title: "Error",
        description: "Course code is required",
        variant: "destructive",
        duration: 3000,
      });
      return false;
    }

    try {
      const exists = await checkCourseCodeExists(courseCode);

      if (exists) {
        toast({
          title: "Error",
          description: "Course code already exists",
          variant: "destructive",
          duration: 3000,
        });
        return false;
      }

      return true;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to check course code",
        variant: "destructive",
        duration: 3000,
      });
      return false;
    }
  };

  const checkCourseCodeExists = async (code: string) => {
    try {
      const response = await userService.get(`/user`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const listOfAllCourses = response.data.courses.map(
        (course: Course) => course.course_code
      );

      if (listOfAllCourses.includes(code)) {
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error checking course code:", error);
      return false;
    }
  };

  return { checkCourseCode };
}
