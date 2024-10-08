"use client"

import { Navbar } from "@/components/navbar";
import {SearchDialogModal} from "@/components/search-dialog";
import {useState} from "react";
import InstructorDashboard from "@/components/instructor-dashboard";

export default function Home() {
    const [isDialogOpen, setDialogOpen] = useState(false);
    const handleSearchButtonClick = () => {
      setDialogOpen(!isDialogOpen);
    };
    return (
        <main>
           <Navbar onSearchButtonClick={handleSearchButtonClick} />
           <SearchDialogModal isOpen={isDialogOpen} onClose={setDialogOpen} />
           <InstructorDashboard />
        </main>
    );
}