"use client"
import * as React from "react";
import {
    Card,
    CardHeader,
    CardFooter,
    CardTitle,
    CardDescription,
    CardContent } from "@/components/ui/card";
import {CoursesList} from "@/components/courses-list";
import {useCallback, useEffect, useState} from "react";
import Cookies from "js-cookie";
import {Course} from "@/app/types";
import {backendAPI} from "@/environment/backend_api";
import {CourseDialogModal} from "@/components/course-dialog";
import {useToast} from "@/hooks/use-toast";
import {ToastAction} from "@/components/ui/toast";

export default function UserDashboard() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseDialog, setCourseDialog] = useState<boolean>(false);
  const [token] = useState<string>(
    Cookies.get("authToken") as string
  );
  const {toast} = useToast();

  const fetchCourses = useCallback(async () => {
    if (!token) return;

    try {
      const response = await backendAPI.get(`/users/me`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      setCourses(response.data?.courses || []); // Optional chaining
    } catch (error) {
      console.error(error.response); // Log full error response for debugging
      toast({
        title: "Error",
        description: `Error fetching course data: ${error.message}`,
        variant: "destructive",
        action: <ToastAction altText="Try again">Try again</ToastAction>,
      });
    }
  }, [token, toast]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const cardData = [
    {
      title: "Card 1",
      description: "This is card 1 description.",
      content: "Content for card 1.",
      footer: "Footer for card 1"
    },
    {
      title: "Card 2",
      description: "This is card 2 description.",
      content: "Content for card 2.",
      footer: "Footer for card 2"
    },
    {
      title: "Card 3",
      description: "This is card 3 description.",
      content: "Content for card 3.",
      footer: "Footer for card 3"
    },
    {
      title: "Card 4",
      description: "This is card 4 description.",
      content: "Content for card 4.",
      footer: "Footer for card 4"
    }
  ];

  return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-4 gap-4">
          {cardData.map((card, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle>{card.title}</CardTitle>
                  <CardDescription>{card.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>{card.content}</p>
                </CardContent>
                <CardFooter>
                  <p>{card.footer}</p>
                </CardFooter>
              </Card>
          ))}
        </div>

        <div className="grid grid-cols-5 gap-4 h-[55lvh]">
          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Big Card</CardTitle>
              <CardDescription>This is the big card on the left.</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Content for the big card.</p>
            </CardContent>
            <CardFooter>
              <p>Footer for the big card</p>
            </CardFooter>
          </Card>
          <CoursesList courses={courses}
                       onCourseDelete={fetchCourses}
                       setCourseDialog={setCourseDialog}
                       onCourseUpdate={fetchCourses}
          />
        </div>
        <CourseDialogModal
            isOpen={courseDialog}
            onClose={setCourseDialog}
            onCourseCreation={fetchCourses}
        />
      </div>
  );
}
