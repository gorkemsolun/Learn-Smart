"use client";

import CourseDashboard from "@/components/course-dashboard";
import { Navbar } from "@/components/navbar";

export default function CourseHomePage() {
  return (
    <main>
      <Navbar />
      <CourseDashboard />
    </main>
  );
}
