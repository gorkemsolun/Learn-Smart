"use client";

import dayjs from "dayjs";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { Course } from "@/app/types";
import { UserChart } from "@/components/analytics/user-analytics";
import { CourseDialogModal } from "@/components/course/course-dialog";
import { CoursesList } from "@/components/course/courses-list";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { ToastAction } from "@/components/ui/toast";
import { userService } from "@/environment/backend_api";
import { useToast } from "@/hooks/use-toast";
import { useLoading } from "@/hooks/useLoading"; // Import useLoading hook
import { AutoGraph } from "@mui/icons-material";
import ChatIcon from "@mui/icons-material/Chat";
import HubIcon from "@mui/icons-material/Hub";
import PersonIcon from "@mui/icons-material/Person";
import { LoadingSpinner } from "../loading-spinner";

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
  const { loading, startLoading, stopLoading } = useLoading(); // Initialize useLoading hook
  const { toast } = useToast();
  const router = useRouter();

  const fetchDashboardData = useCallback(async () => {
    if (!token) return;

    startLoading(); // Start loading before fetching data
    try {
      // Fetch courses first
      const coursesResponse = await userService.get("/user", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      setCourses(coursesResponse.data?.courses || []);

      // Ensure no overlapping requests before analytics fetch
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Fetch analytics
      const analyticsResponse = await userService.get("/analytics", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const getLast7Days = () => {
        return [...Array(7)].map((_, i) =>
          dayjs()
            .subtract(6 - i, "day")
            .format("YYYY-MM-DD")
        );
      };

      const last7Days = getLast7Days(); // Get the last 7 days in order

      const formattedData = analyticsResponse.data.map(
        (item: { date: string; time_spent: number; timestamp: string }) => ({
          day: mapDateToDay(item.date),
          date: item.date,
          timeSpent: item.time_spent,
          timestamp: item.timestamp,
        })
      );

      const chartData = last7Days.map((date) => {
        const found = formattedData.find(
          (item: { date: string; timeSpent: number; timestamp: string }) =>
            item.date === date
        );
        return {
          day: mapDateToDay(date),
          date,
          timeSpent: found ? found.timeSpent : 0,
          timestamp: found ? found.timestamp : new Date(date).toISOString(),
        };
      });
      setChartData(chartData);

      /* 
      // Mock data until analytics service is implemented
      setChartData([
        { day: "Mon", timeSpent: 0 },
        { day: "Tue", timeSpent: 0 },
        { day: "Wed", timeSpent: 0 },
        { day: "Thu", timeSpent: 0 },
        { day: "Fri", timeSpent: 0 },
        { day: "Sat", timeSpent: 0 },
        { day: "Sun", timeSpent: 0 },
      ]); */
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      /*
      toast({
        title: "Error",
        description: `Failed to fetch dashboard data: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
        action: <ToastAction altText="Retry">Retry</ToastAction>,
      });
      */
    } finally {
      stopLoading(); // Stop loading after data fetch completes
    }
  }, [token, toast, startLoading, stopLoading]);

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
      link:
        courses.length === 0
          ? "error_chat"
          : `/course/${courses[0].course_id}/chat`,
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
      link: "/profile",
    },
  ];

  const handleCardClick = (link: string) => {
    if (link === "error_chat") {
      toast({
        title: "No Course Found",
        description: "Please create a course before accessing the chat.",
        variant: "destructive",
        action: (
          <ToastAction altText="Create" onClick={() => setCourseDialog(true)}>
            Create
          </ToastAction>
        ),
      });
      return;
    }

    if (link) {
      startLoading(); // Start loading before navigation
      router.push(link);
    }
  };

  if (loading) return <LoadingSpinner />;

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
            <div className="from-primary/5 via-secondary/5 to-background flex h-[24vh] items-center rounded-xl bg-gradient-to-br p-3 sm:p-4 lg:p-6">
              <div className="min-w-0 grow space-y-2">
                <CardTitle className="max-w-[90%] truncate text-base font-bold md:text-lg lg:text-xl">
                  {card.title}
                </CardTitle>
                <CardDescription className="text-muted-foreground max-w-[95%] truncate text-sm md:text-base">
                  {card.content}
                </CardDescription>
              </div>
              <div
                className="bg-primary/10 text-primary ml-2 flex size-[6vh] shrink-0 items-center justify-center rounded-full md:size-[7vh]"
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
              startLoading={startLoading}
              stopLoading={stopLoading}
            />
          </div>
        </div>
      )}

      {/* Course Creation Dialog */}
      <CourseDialogModal
        isCreate={true}
        isOpen={courseDialog}
        onClose={setCourseDialog}
        onCourseCreation={fetchDashboardData}
        onCourseUpdate={fetchDashboardData}
      />
    </div>
  );
}
