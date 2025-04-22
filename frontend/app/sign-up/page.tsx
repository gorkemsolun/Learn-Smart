"use client";

import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ToastAction } from "@/components/ui/toast";
import { backendAPI } from "@/environment/backend_api";
import { useToast } from "@/hooks/use-toast";
import {
  CheckCircledIcon,
  CrossCircledIcon,
  EnvelopeClosedIcon,
  LockClosedIcon,
  PersonIcon,
} from "@radix-ui/react-icons";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useState } from "react";

export default function SignUp() {
  const [username, setUsername] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");

  const router = useRouter();
  const { toast } = useToast();

  const passwordsMatch = () => password === confirmPassword && password !== "";

  const handleSignUp = async () => {
    const validateEmail = (inputText: string) => {
      const regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
      return regex.test(inputText);
    };

    if (!username || !email || !password || !confirmPassword) {
      toast({
        title: "Please fill out all fields",
        description: "You need to fill all fields",
        variant: "destructive",
        action: <ToastAction altText="Try again">Try again</ToastAction>,
      });
      return;
    }

    if (!validateEmail(email)) {
      toast({
        title: "Invalid email format",
        description: "Please enter a valid email",
        variant: "destructive",
        action: <ToastAction altText="Try again">Try again</ToastAction>,
      });
      return;
    }

    if (!passwordsMatch()) {
      toast({
        title: "Passwords do not match",
        description: "Please enter the same password",
        variant: "destructive",
        action: <ToastAction altText="Try again">Try again</ToastAction>,
      });
      return;
    }

    await backendAPI
      .post(
        "/users/create",
        {
          nickname: username,
          email: email,
          password: password,
        },
        {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      )
      .then((response) => {
        if (response.status === 200) {
          toast({
            title: "Account created successfully",
            variant: "default",
          });
          router.push("/sign-in");
        }
      })
      .catch((error) => {
        console.error("Create account error:", error);
        toast({
          title: "Account creation failed",
          description: "This user is already registered.",
          variant: "destructive",
          action: <ToastAction altText="Try again">Try again</ToastAction>,
        });
      });
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6">
      <Card className="relative w-full overflow-hidden md:max-w-3xl lg:max-w-4xl">
        <div className="flex h-full flex-col md:flex-row">
          <div
              className="hidden border-r bg-foreground/5 md:flex md:w-1/2 md:flex-col md:items-center md:justify-center md:rounded-l-lg md:p-6">
            <div className="absolute left-4 top-4 flex items-center space-x-2">
              <Icons.logo className="size-5"/>
              <p className="text-base font-bold">edux/ai</p>
            </div>
          </div>

          <div className="flex w-full flex-col items-center justify-center p-4 md:w-1/2 md:p-6">
            <div className="mb-4 flex items-center space-x-2 md:hidden">
              <Icons.logo className="size-5" />
              <p className="text-sm font-bold">edux/ai</p>
            </div>

            <Button
              onClick={() => router.push("/sign-in")}
              className="absolute right-4 top-4 bg-transparent px-3 py-1.5 text-sm text-foreground shadow-none hover:bg-foreground/10"
            >
              Sign in
            </Button>

            <CardHeader className="space-y-1 text-center">
              <CardTitle className="p-4 text-xl sm:text-2xl">Sign up an account</CardTitle>
            </CardHeader>

            <CardContent className="flex w-full flex-col items-center justify-center">
              <form className="flex w-full flex-col items-center justify-center">
                <div className="grid w-5/6 items-center gap-4">
                  <div className="flex w-full flex-col space-y-1.5">
                    <div className="relative w-full">
                      <EnvelopeClosedIcon className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-gray-400" />
                      <Input
                        type="text"
                        placeholder="email@example.com"
                        className="pl-10"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>

                    <div className="relative w-full">
                      <PersonIcon className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-gray-400" />
                      <Input
                        type="text"
                        placeholder="username"
                        className="pl-10"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                      />
                    </div>

                    <div className="relative w-full">
                      <LockClosedIcon className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-gray-400" />
                      <Input
                        type="password"
                        placeholder="********"
                        className="pl-10"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>

                    <div className="relative w-full">
                      {passwordsMatch() ? (
                        <CheckCircledIcon className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-gray-400" />
                      ) : (
                        <CrossCircledIcon className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-gray-400" />
                      )}
                      <Input
                        type="password"
                        placeholder="********"
                        className="pl-10"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </form>
            </CardContent>

            <CardFooter className="flex w-full justify-center">
              <Button className="w-5/6" onClick={handleSignUp}>
                Sign up
              </Button>
            </CardFooter>

            <CardFooter className="mt-2 flex w-full justify-center">
              <p className="w-3/5 text-center text-xs text-foreground/60">
                By clicking continue, you agree to our{" "}
                <a className="text-foreground/60 underline hover:text-foreground/80" href="">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a className="text-foreground/60 underline hover:text-foreground/80" href="">
                  Privacy Policy.
                </a>
              </p>
            </CardFooter>
          </div>
        </div>
      </Card>
    </div>
  );
}
