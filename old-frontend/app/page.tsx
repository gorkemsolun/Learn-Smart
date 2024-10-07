"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function PageHandler() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/login");
    }, 100);

    // Clean up the timer on component unmount
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="bg-transparent min-h-screen">
      <h1>Redirecting to login...</h1>
    </div>
  );
}
