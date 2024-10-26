"use client"

import { NavbarHeader } from "@/components/navbar-header";
import {SearchDialogModal} from "@/components/search-dialog";
import {useEffect, useState} from "react";
import InstructorDashboard from "@/components/instructor-dashboard";
import Cookies from "js-cookie";
import {useRouter} from "next/navigation";

export default function Home() {
    const [isDialogOpen, setDialogOpen] = useState(false);
    const [token] = useState<string>(
        Cookies.get("authToken") as string
    );

    const router = useRouter();

    useEffect(() => {
        if (!token) {
            router.replace("/sign-in");
        }
    }, [token, router]);

    const handleSearchButtonClick = () => {
      setDialogOpen(!isDialogOpen);
    };

    return (
        <main>
           <NavbarHeader onSearchButtonClick={handleSearchButtonClick} />
           <SearchDialogModal isOpen={isDialogOpen} onClose={setDialogOpen} />
           <InstructorDashboard />
        </main>
    );
}