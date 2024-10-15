"use client"

import CourseDashboard from "@/components/course-dashboard";
import { Navbar } from "@/components/navbar";
import {useState} from "react";

export default function CourseHomePage() {
  const [isDialogOpen, setDialogOpen] = useState(false);

  const handleSearchButtonClick = () => {
    setDialogOpen(!isDialogOpen);
  };

  return (
      <main>
        <Navbar onSearchButtonClick={handleSearchButtonClick} />
         <CourseDashboard />
      </main>
  );
}