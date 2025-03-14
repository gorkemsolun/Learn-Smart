"use client";
import * as React from "react";
import {Button} from "@/components/ui/button";
import {ToastAction} from "@/components/ui/toast";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import Cookies from "js-cookie";
import {Icons} from "@/components/icons";
import {EnvelopeClosedIcon, LockClosedIcon} from "@radix-ui/react-icons";
import {FcGoogle} from "react-icons/fc";
import {useRouter} from "next/navigation";
import {useToast} from "@/hooks/use-toast";
import {useEffect, useState} from "react";
import {authService} from "@/environment/backend_api";
import ImageSlider from "@/components/image-slider";

export default function SignIn() {

  const [email, setEmail] = useState<string>(Cookies.get("emailCookie") || "");
  const [password, setPassword] = useState<string>("");
  // const [role, setRole] = useState<string>("" || null);
  const router = useRouter();
  const {toast} = useToast();

  useEffect(() => {
    const fetchAndRedirect = async () => {
      const emailCookie = Cookies.get("emailCookie");
      if (emailCookie) {
        setEmail(emailCookie);
      }

      const authToken = Cookies.get("authToken");
      if (authToken) {
        router.push("/edux-homepage");
      }
    };

    fetchAndRedirect();
  }, [router]);

  const handleSignIn = async () => {
    await authService
        .post(
            "/login",
            {
              username: email,
              password: password,
            },
            {
              headers: {
                Accept: "application/json",
                "Content-Type": "application/x-www-form-urlencoded",
              },
            }
        )
        .then((response) => {
          toast({
              title: "Sign in successful",
              variant: "default",
            });

          const data = response.data;
          // Store the token in a cookie
          Cookies.set("authToken", data["access_token"], {expires: 3});
          Cookies.set("signin_time", new Date().toISOString(), {path: "/" });
          router.push("/edux-homepage");
        })
        .catch((error) => {
          console.error("Sign in error:", error);
          toast({
            title: "There is no such user",
            description: "Details you entered does not match with a record",
            variant: "destructive",
            action: <ToastAction altText="Try again">Try again</ToastAction>,
          });
        });
  };

  // TO-DO after domain acquired this place will be updated
  const handleGoogleSignIn = () => {
  };

  return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="relative flex h-[72vh] w-3/5 overflow-auto">
          <Button
              onClick={() => router.push('/sign-up')}
              className="absolute right-4 top-4 bg-transparent text-foreground shadow-none hover:bg-foreground/10"
          >
            Sign up
          </Button>

          <div className="border-1 relative flex w-1/2 items-center justify-center space-y-4 rounded-l-lg bg-foreground/5 p-4">
            <div className="absolute left-4 top-4 flex items-center space-x-2">
              <Icons.logo className="size-6"/>
              <p className="font-bold">edux/ai</p>
            </div>
            <div className="h-[56vh] w-full">
              <ImageSlider/>
            </div>
          </div>

          <div className="flex w-1/2 flex-col items-center justify-center p-4">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Sign in an account</CardTitle>
            </CardHeader>

            <CardContent className="flex w-full flex-col items-center justify-center">
              <form className="flex w-full flex-col items-center justify-center">
                <div className="grid w-5/6 items-center gap-4">
                  <div className="flex w-full flex-col space-y-1.5">

                    <div className="relative w-full">
                      <EnvelopeClosedIcon
                          className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-gray-400"/>
                      <Input
                          type="text"
                          placeholder="email@example.com"
                          className="pl-10"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>

                    <div className="relative w-full">
                      <LockClosedIcon
                          className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-gray-400"/>
                      <Input
                          type="password"
                          placeholder="********"
                          className="pl-10"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </form>
            </CardContent>

            <CardFooter className="flex w-full justify-center">
              <Button className="w-5/6" onClick={handleSignIn}>
                Sign in
              </Button>
            </CardFooter>

            <CardContent className="flex w-full flex-col items-center justify-center">
              <div className="grid w-5/6 items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t"></span></div>
                  <div className="relative flex justify-center text-xs uppercase"><span
                      className="bg-background px-2 text-muted-foreground">Or continue with</span></div>
                </div>
                <Button
                    className="inline-flex items-center justify-center space-x-2 whitespace-nowrap rounded-md border
                  border-input bg-background px-4 py-2 text-sm
                  font-medium text-accent-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none
                  focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50" onClick={handleGoogleSignIn}>
                  <FcGoogle/>
                  <span>Google</span>
                </Button>
              </div>
            </CardContent>

            <p className="w-3/5 text-center text-xs text-foreground/60">
              By clicking continue, you agree to our <a
                className="text-foreground/60 underline hover:text-foreground/80"
                href="">
              Terms of Service
            </a> and <a className="text-foreground/60 underline hover:text-foreground/80" href="">
              Privacy Policy.
            </a>
            </p>
          </div>
        </Card>
      </div>
  );
}


