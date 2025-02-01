"use client";

import { Course } from "@/app/types";
import { CourseCreateDialog } from "@/components/course-create-dialog";
import { CoursesList } from "@/components/courses-list";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { ToastAction } from "@/components/ui/toast";
import { backendAPI } from "@/environment/backend_api";
import { useToast } from "@/hooks/use-toast";
import HubIcon from '@mui/icons-material/Hub';
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

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
      <div className="space-y-6 p-6">
        <div className="grid h-[25vh] grid-cols-4 gap-4">
          {cardData.map((card, index) => (
              <Card
                  key={index}
                  onClick={() => handleCardClick(card.link)}
                  className="h-full cursor-pointer transition-shadow duration-300
                  hover:shadow-lg"
              >
                <div
                    className="flex h-full items-center rounded-xl bg-gradient-to-br from-primary/5 via-secondary/5 to-background p-6"
                >
                  <div className="grow space-y-2">
                    <CardTitle className="text-xl font-bold">{card.title}</CardTitle>
                    <CardDescription className="text-sm text-muted-foreground">{card.content}</CardDescription>
                  </div>
                  <div
                      className="ml-4 flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
                      aria-hidden="true"
                  >
                    {card.icon}
                  </div>
                </div>
              </Card>
          ))}
        </div>

        <div className="grid h-[55vh] grid-cols-7 gap-4">
          <div className="col-span-4">
            <Card className="h-full bg-gradient-to-br from-primary/5 via-secondary/5 to-background">
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
