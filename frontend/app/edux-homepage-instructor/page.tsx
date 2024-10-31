"use client";

import InstructorDashboard from "@/components/instructor-dashboard";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Home() {
  const [token] = useState<string>(Cookies.get("authToken") as string);

  const router = useRouter();

  useEffect(() => {
    if (!token) {
      router.replace("/sign-in");
    }
  }, [token, router]);

  return (
    <main>
      <InstructorDashboard />
    </main>
  );
}
