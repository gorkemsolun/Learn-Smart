"use client";

import { Check, XCircle } from "lucide-react";
import { OnboardingProcessProps } from "@/app/types";

export function OnboardingProgress(modalParameters: OnboardingProcessProps) {
  return (
    <div className="w-full bg-background py-1.5 text-foreground">
      <div className="relative mx-auto flex max-w-4xl justify-between px-4">
        {modalParameters.steps.map((step, index) => (
          <div key={index} className="relative flex flex-col items-center">
            <div className="text-xs font-medium text-foreground/50">{step.step}</div>
            <div
              className={`mt-2 text-sm ${
                step.status === "current" || step.status === "error"
                  ? "text-primary"
                  : "text-foreground/60"
              }`}
            >
              {step.title}
            </div>
            <div className="relative mt-4">
              {step.status === "complete" ? (
                <div className="flex size-6 items-center justify-center rounded-full bg-primary text-background">
                  <Check className="size-4" />
                </div>
              ) : step.status === "error" ? (
                <div className="flex size-6 items-center justify-center rounded-full bg-red-500 text-background">
                  <XCircle className="size-4" />
                </div>
              ) : (
                <div
                  className={`size-6 rounded-full ${
                    step.status === "current" ? "bg-primary/50" : "bg-foreground/20"
                  }`}
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
