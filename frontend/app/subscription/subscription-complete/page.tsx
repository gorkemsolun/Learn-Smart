"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OnboardingProgress } from "@/components/onboarding-progress";
import { CheckCircle, XCircle, ArrowRight, Loader2 } from "lucide-react";

export default function SubscriptionComplete() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);

  const isSuccess = searchParams.get("status") === "success";

  const steps = [
    { step: "STEP 1", title: "Tier Plan", status: "complete" },
    { step: "STEP 2", title: "Confirmation", status: "complete" },
    { step: "STEP 3", title: "Complete", status: isSuccess ? "complete" : "error" },
  ];

  useEffect(() => {
    setIsLoading(false);
  }, [router]);

  const handleDashboardNavigation = () => {
    router.push("/edux-homepage");
  };

  const handleRetry = () => {
    router.push("/subscription");
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="size-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex grow flex-col items-center justify-center bg-background p-6 font-thin">
      <OnboardingProgress steps={steps} />
      <div className="mx-auto mt-6 w-full max-w-3xl">
        <Card className="w-full overflow-hidden shadow-lg">
          <div className="bg-primary p-6 text-primary-foreground">
            <h2 className="text-2xl">{isSuccess ? "Subscription Confirmed" : "Subscription Failed"}</h2>
          </div>
          <CardContent className="p-6">
            <div className="flex flex-col items-center space-y-6 text-center">
              {isSuccess ? (
                <CheckCircle className="size-20" />
              ) : (
                <XCircle className="size-20" />
              )}
              <h3 className="text-2xl">
                {isSuccess ? "Thank You for Your Subscription!" : "Oops! Something went wrong."}
              </h3>
              <p className="text-muted-foreground">
                {isSuccess
                  ? "Your payment has been processed successfully, and your subscription is now active."
                  : "We encountered an issue while processing your subscription. Please try again."}
              </p>
              {isSuccess ? (
                <>
                  <div className="flex w-full max-w-xs flex-col space-y-2">
                    <Button onClick={handleDashboardNavigation} className="w-full text-sm font-thin">
                      Go to Dashboard Now <ArrowRight className="ml-2 size-4" />
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex w-full max-w-xs flex-col space-y-2">
                    <Button onClick={handleRetry} className="w-full text-sm font-thin">
                      Try Again
                    </Button>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

