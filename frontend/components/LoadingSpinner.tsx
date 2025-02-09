import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  message?: string;
  subMessage?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = "Loading...",
  subMessage = "Please wait a moment",
}) => {
  return (
    <div className="flex justify-center items-center h-screen bg-muted">
      <Card className="p-6 flex flex-col items-center space-y-4 shadow-lg">
        {/* Animated Spinner */}
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        {/* Loading Text */}
        <p className="text-lg font-semibold text-foreground">{message}</p>
        {/* Subtle Animation */}
        <p className="text-sm text-muted-foreground animate-pulse">{subMessage}</p>
      </Card>
    </div>
  );
};
