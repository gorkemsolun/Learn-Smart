"use client"

import { Navbar } from "@/components/navbar";
import {SearchDialogModal} from "@/components/search-dialog";
import {useEffect, useState} from "react";
import UserDashboard from "@/components/user-dashboard";
import {useRouter} from "next/navigation";
import Cookies from "js-cookie";

export default function Home() {
    const [isDialogOpen, setDialogOpen] = useState(false);
    const [token, setToken] = useState<string | null>(null);

    const router = useRouter();

    useEffect(() => {
        const authToken = Cookies.get("authToken");
        setToken(authToken || null);

        if (!authToken) {
            router.replace("/sign-in");
        }
    }, [router, token]);

    const handleSearchButtonClick = () => {
      setDialogOpen(!isDialogOpen);
    };

    return (
        <main>
           <Navbar onSearchButtonClick={handleSearchButtonClick} />
           <SearchDialogModal isOpen={isDialogOpen} onClose={setDialogOpen} />
           <UserDashboard />
        </main>
    );
}