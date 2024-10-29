"use client";

import { Navbar } from "@/components/navbar";
import {useEffect, useState} from "react";
import UserDashboard from "@/components/user-dashboard";
import {useRouter} from "next/navigation";
import Cookies from "js-cookie";

export default function Home() {
    const [token, setToken] = useState<string | null>(null);

    const router = useRouter();

    useEffect(() => {
        const authToken = Cookies.get("authToken");
        setToken(authToken || null);

        if (!authToken) {
            router.replace("/sign-in");
        }
    }, [router, token]);

    return (
        <main>
          <Navbar />
          <UserDashboard />
        </main>
    );
}