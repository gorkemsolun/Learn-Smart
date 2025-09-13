// components/SuspenseWrapper.tsx
"use client";

import { Suspense } from "react";

export default function SuspenseWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen"><div>Loading...</div></div>}>
      {children}
    </Suspense>
  );
}