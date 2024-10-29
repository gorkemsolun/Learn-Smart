"use client";

import * as React from "react";
import { Course } from "@/app/types";
import { CourseCreateDialog } from "@/components/course-create-dialog";
import { CoursesList } from "@/components/courses-list";
import {
    Card,
    CardHeader,
    CardFooter,
    CardTitle,
    CardDescription,
    CardContent } from "@/components/ui/card";
import {useCallback, useEffect, useState} from "react";
import Cookies from "js-cookie";
import {backendAPI} from "@/environment/backend_api";
import {useToast} from "@/hooks/use-toast";
import {ToastAction} from "@/components/ui/toast";
import HubIcon from '@mui/icons-material/Hub';
import {useRouter} from "next/navigation";

export default function UserDashboard() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseDialog, setCourseDialog] = useState<boolean>(false);
  const [token] = useState<string>(Cookies.get("authToken") as string);
  const { toast } = useToast();
  const router = useRouter();

  const fetchCourses = useCallback(async () => {
    if (!token) return;

    try {
      const response = await backendAPI.get(`/users/me`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      setCourses(response.data?.courses || []);
    } catch (error) {
      console.error(error.response);
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
      title: "Skill Tree",
      content: "Conquer each skill, reveal new branches and quizzes.",
      icon: <HubIcon />,
      link: "/skill-tree"
    },
    {
      title: "Card 2",
      content: "Content for card 2.",
      icon: null,
      link: ""
    },
    {
      title: "Card 3",
      content: "Content for card 3.",
      icon: null,
      link: ""
    },
    {
      title: "Card 4",
      content: "Content for card 4.",
      icon: null,
      link: ""
    }
  ];

  const handleCardClick = (link: string) => {
    router.push(link);
  };

  return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-4 gap-4 h-[25vh]">
          {cardData.map((card, index) => (
              <Card
                  key={index}
                  onClick={() => handleCardClick(card.link)}
                  className="g-gradient-to-br from-primary/10 to-secondary/10
                  hover:shadow-lg transition-shadow duration-300 cursor-pointer
                  h-full"
              >
                <div
                    className="h-full flex items-center bg-gradient-to-br from-primary/5
                    via-secondary/5 to-background p-6 rounded-xl"
                >
                  <div className="flex-grow space-y-2">
                    <CardTitle className="text-xl font-bold">{card.title}</CardTitle>
                    <CardDescription className="text-sm text-muted-foreground">{card.content}</CardDescription>
                  </div>
                  <div
                      className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary ml-4"
                      aria-hidden="true"
                  >
                    {card.icon}
                  </div>
                </div>
              </Card>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-4 h-[55vh]">
          <div className="col-span-4">
            <Card className="h-full">
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
          </div>
          <div className="col-span-3">
            <CoursesList courses={courses}
                       onCourseDelete={fetchCourses}
                       setCourseDialog={setCourseDialog}
                       onCourseUpdate={fetchCourses}
            />
          </div>
        </div>
        <CourseCreateDialog
            isOpen={courseDialog}
            onClose={setCourseDialog}
            onCourseCreation={fetchCourses}
        />
      </div>
  );
}
