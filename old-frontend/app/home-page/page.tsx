"use client";

import Navbar from "@/app/components/navbar/navbar";
import CoursePreview from "@/app/course/course-preview";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { printDebugMessage } from "../debugger";

export default function HomePage() {
  const [token, setToken] = useState<string>(
    Cookies.get("authToken") as string
  );
  const router = useRouter();

  useEffect(() => {
    setToken(Cookies.get("authToken") || "");
    printDebugMessage("Token: " + token);
  }, []);

  if (token == null) {
    router.replace("/login");
  }

  return (
    <main className="bg-transparent min-h-screen">
      <Navbar />
      <div className="p-5">
        <CoursePreview />
      </div>
    </main>
  );
}
