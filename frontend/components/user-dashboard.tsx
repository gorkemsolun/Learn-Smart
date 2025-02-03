"use client";

import * as React from "react";
import dayjs from "dayjs";
import { useCallback, useEffect, useState } from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";

import { Course } from "@/app/types";
import { CourseCreateDialog } from "@/components/course-create-dialog";
import { CoursesList } from "@/components/courses-list";
import { UserChart } from "@/components/user-analytics";
import {
  Card,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { backendAPI } from "@/environment/backend_api";

import HubIcon from "@mui/icons-material/Hub";
import ChatIcon from "@mui/icons-material/Chat";
import PersonIcon from "@mui/icons-material/Person";
import { AutoGraph } from "@mui/icons-material";

// Helper function to map dates to weekdays
const mapDateToDay = (dateString: string): string => {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const date = new Date(dateString);
  return days[date.getDay()];
};

export default function UserDashboard() {
  const [chartData, setChartData] = useState([
    { day: "Mon", timeSpent: 0 },
    { day: "Tue", timeSpent: 0 },
    { day: "Wed", timeSpent: 0 },
    { day: "Thu", timeSpent: 0 },
    { day: "Fri", timeSpent: 0 },
    { day: "Sat", timeSpent: 0 },
    { day: "Sun", timeSpent: 0 },
  ]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseDialog, setCourseDialog] = useState<boolean>(false);
  const token = Cookies.get("authToken") as string;
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  const fetchDashboardData = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    try {
      // Fetch courses first
      const coursesResponse = await backendAPI.get("/users/me", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      setCourses(coursesResponse.data?.courses || []);

      // Ensure no overlapping requests before analytics fetch
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Fetch analytics
      const analyticsResponse = await backendAPI.get("/analytics/", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const getLast7Days = () => {
        return [...Array(7)].map((_, i) => dayjs().subtract(6 - i, "day").format("YYYY-MM-DD"));
      };

      const last7Days = getLast7Days(); // Get the last 7 days in order

      const formattedData = analyticsResponse.data.map((item: { date: string; time_spent: number; timestamp: string }) => ({
        day: mapDateToDay(item.date),
        date: item.date,
        timeSpent: item.time_spent,
        timestamp: item.timestamp,
      }));

      const chartData = last7Days.map((date) => {
        const found = formattedData.find((item) => item.date === date);
        return {
          day: mapDateToDay(date),
          date,
          timeSpent: found ? found.timeSpent : 0,
          timestamp: found ? found.timestamp : new Date(date).toISOString(),
        };
      });
      setChartData(chartData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast({
        title: "Error",
        description: `Failed to fetch dashboard data: ${error.message}`,
        variant: "destructive",
        action: <ToastAction altText="Retry">Retry</ToastAction>,
      });
    } finally {
      setLoading(false);
    }
  }, [token, toast]);

  useEffect(() => {
    if (token) {
      fetchDashboardData();
    }
  }, [token]);

  const cardData = [
    {
      title: "Skill Tree",
      content: "Conquer each skill.",
      icon: <HubIcon className="text-3xl md:text-4xl" />,
      link: "/skill-tree",
    },
    {
      title: "Chat",
      content: "Ask, learn using chatbot.",
      icon: <ChatIcon className="text-3xl md:text-4xl" />,
      link: "",
    },
    {
      title: "Engagement Metrics",
      content: "Track your engagement.",
      icon: <AutoGraph className="text-3xl md:text-4xl" />,
      link: "",
    },
    {
      title: "Profile",
      content: "Adjust your preferences.",
      icon: <PersonIcon className="text-3xl md:text-4xl" />,
      link: "",
    },
  ];

  const handleCardClick = (link: string) => {
    if (link) router.push(link);
  };

  return (
    <div className="mx-auto space-y-6 p-4 sm:p-6 lg:p-4">
      {/* Cards Section */}
      <div className="grid grid-cols-4 gap-4">
        {cardData.map((card, index) => (
          <Card
            key={index}
            onClick={() => handleCardClick(card.link)}
            className="h-full cursor-pointer transition-shadow duration-300 hover:shadow-lg"
          >
            <div className="flex h-[24vh] items-center rounded-xl bg-gradient-to-br from-primary/5 via-secondary/5 to-background p-3 sm:p-4 lg:p-6">
              <div className="min-w-0 grow space-y-2">
                <CardTitle className="max-w-[90%] truncate text-base font-bold md:text-lg lg:text-xl">
                  {card.title}
                </CardTitle>
                <CardDescription className="max-w-[95%] truncate text-sm text-muted-foreground md:text-base">
                  {card.content}
                </CardDescription>
              </div>
              <div
                className="ml-2 flex size-[6vh] shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary md:size-[7vh]"
                aria-hidden="true"
              >
                {card.icon}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Chart and Courses Section */}
      {loading ? (
        <div className="flex h-[50vh] items-center justify-center">
          <span className="text-gray-500">Loading...</span>
        </div>
      ) : (
        <div className="grid h-[50vh] grid-cols-1 gap-4 lg:grid-cols-7">
          <div className="lg:col-span-4">
            <UserChart chartData={chartData} />
          </div>
          <div className="lg:col-span-3">
            <CoursesList
              courses={courses}
              onCourseDelete={fetchDashboardData}
              setCourseDialog={setCourseDialog}
              onCourseUpdate={fetchDashboardData}
            />
          </div>
        </div>
      )}

      {/* Course Creation Dialog */}
      <CourseCreateDialog
        isOpen={courseDialog}
        onClose={setCourseDialog}
        onCourseCreation={fetchDashboardData}
      />
    </div>
  );
}
