"use client";

import type React from "react";

import { useState } from "react";
import { CheckCircle } from "@mynaui/icons-react";
import { useRouter } from "next/navigation";
import { EnvelopeClosedIcon } from "@radix-ui/react-icons";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { backendAPI } from "@/environment/backend_api";

export default function ForgotPassword() {
  const [email, setEmail] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const router = useRouter();
  const { toast } = useToast();

  {/* TO-DO IMPLEMENT THE BACKEND LOGIC */}
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Replace with your actual password reset API endpoint
      await backendAPI.post("/users/reset-password-request", {
        email: email,
      });

      setIsSubmitted(true);
      toast({
        title: "Reset link sent",
        description: "If an account exists with this email, you'll receive a password reset link",
      });
    } catch (error) {
      console.error("Password reset error:", error);
      // We don't want to reveal if an email exists in the system or not
      // So we show the same success message even if the request fails
      setIsSubmitted(true);
      toast({
        title: "Reset link sent",
        description: "If an account exists with this email, you'll receive a password reset link",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-3 pt-10 text-center">
          <CardTitle className="text-xl font-thin sm:text-2xl">
            {isSubmitted ? "Check your email" : "Forgot your password?"}
          </CardTitle>
          <CardDescription className="font-light text-sm">
            {isSubmitted
              ? "We've sent you a password reset link if an account exists with that email"
              : "Enter your email address and we'll send you a link to reset your password"}
          </CardDescription>
        </CardHeader>

        {!isSubmitted ? (
          <>
            <CardContent>
              <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
                <div className="relative">
                  <EnvelopeClosedIcon className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-gray-400" />
                  <Input
                    type="email"
                    placeholder="email@example.com"
                    className="pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full font-light" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Icons.spinner className="mr-2 size-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send reset link"
                  )}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex justify-center">
              <p className="text-center text-xs font-light text-foreground/60">
                Remember your password?{" "}
                <Button variant="link" className="h-auto p-0 text-xs font-light" onClick={() => router.push("/sign-in")}>
                  Sign in
                </Button>
              </p>
            </CardFooter>
          </>
        ) : (
          <CardContent className="flex flex-col items-center space-y-4 pb-8 pt-4">
            <div className="rounded-full bg-green-100 p-3">
              <CheckCircle className="size-6 text-green-600" />
            </div>
            <p className="text-center text-sm font-light text-muted-foreground">
              Please check your email inbox and follow the instructions to reset your password.
            </p>
            <Button className="mt-4 w-full font-light" onClick={() => router.push("/sign-in")}>
              Back to sign in
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
