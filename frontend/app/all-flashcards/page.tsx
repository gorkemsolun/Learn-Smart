"use client";

import { userService } from "@/environment/backend_api";
import { useEffect, useState } from "react";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { useLoading } from "@/hooks/useLoading";
import { LoadingSpinner } from "@/components/loading-spinner";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Info } from "lucide-react";

interface Course {
  course_id: number;
  course_name: string;
  course_code: string;
  course_description: string | null;
  created_at: string;
}

export default function AllFlashcards() {
  const router = useRouter();
  const token = useAuthRedirect();
  const { loading, startLoading, stopLoading } = useLoading();
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    if (token) {
      fetchUserInfo();
    }
  }, [token]);

  async function fetchUserInfo() {
    startLoading();
    try {
      const response = await userService.get(`/user`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      setCourses(response.data.courses || []);
    } catch (error) {
      console.error("Error fetching user info:", error);
    } finally {
      stopLoading();
    }
  }

  const handleCourseClick = (courseId: number) => {
    startLoading();
    router.push(`/course/${courseId}/flashcards`);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Your Courses</h2>
          <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-2 text-blue-600">
            <Info className="size-4" />
            <p className="text-sm">
              Click on any course to view all its flashcards
            </p>
          </div>
        </div>
        
        {courses.length > 0 ? (
          <div className="grid gap-4">
            {courses.map((course) => (
              <Card 
                key={course.course_id}
                className="group cursor-pointer transition-colors hover:bg-accent/50"
                onClick={() => handleCourseClick(course.course_id)}
              >
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="transition-colors group-hover:text-primary">
                      {course.course_name}
                    </CardTitle>
                    <CardDescription>{course.course_code}</CardDescription>
                  </div>
                  <Button 
                    variant="ghost" 
                    className="opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    View Flascards
                  </Button>
                </CardHeader>
                {course.course_description && (
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {course.course_description}
                    </p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>No courses found</CardTitle>
              <CardDescription>
                You haven&#39;t created any courses yet
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>
    </div>
  );
}