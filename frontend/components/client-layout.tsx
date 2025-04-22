"use client";

import { usePathname } from 'next/navigation';
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { Navbar } from "@/components/navbar";
import useExitTracker from "@/hooks/useExitTracker";

export default function ClientLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isNavbar = pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up');

  useExitTracker();
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {!isNavbar && <Navbar />}
      {children}
      <Toaster />
    </ThemeProvider>
  );
}