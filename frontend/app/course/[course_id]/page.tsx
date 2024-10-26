"use client"

import CourseDashboard from "@/components/course-dashboard";
import { NavbarHeader } from "@/components/navbar-header";
import {useState} from "react";

export default function CourseHomePage() {
  const [isDialogOpen, setDialogOpen] = useState(false);

  const handleSearchButtonClick = () => {
    setDialogOpen(!isDialogOpen);
  };

  return (
      <main>
        <NavbarHeader onSearchButtonClick={handleSearchButtonClick} />
         <CourseDashboard />
      </main>
  );
}