"use client";
import { Icons } from "@/components/icons";
import ImageSlider from "@/components/image-slider";
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
import { authService } from "@/environment/backend_api";
import { useToast } from "@/hooks/use-toast";
import { Envelope, Eye, EyeSlash, LockWaves } from "@mynaui/icons-react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FcGoogle } from "react-icons/fc";

export default function SignIn() {
  const [email, setEmail] = useState<string>(Cookies.get("emailCookie") || "");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const router = useRouter();
  const { toast } = useToast();

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
      .then(async (response) => {
        toast({
          title: "Sign in successful",
          variant: "default",
        });

        const data = response.data;
        // Store the token in a cookie
        Cookies.set("authToken", data["access_token"], { expires: 3 });
        Cookies.set("signin_time", new Date().toISOString(), { path: "/" });

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
  const handleGoogleSignIn = () => {};

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6">
      <Card className="relative w-full overflow-hidden md:max-w-3xl lg:max-w-4xl">
        <div className="flex h-full flex-col md:flex-row">
          {/* Left side with image slider - hidden on small screens */}
          <div className="hidden border-r bg-foreground/5 md:flex md:w-1/2 md:flex-col md:items-center md:justify-center md:rounded-l-lg md:p-6">
            <div className="absolute left-4 top-4 flex items-center space-x-2">
              <Icons.logo className="size-5" />
              <p className="text-base font-semibold">edux/ai</p>
            </div>
            <div className="mt-8 flex size-full">
              <ImageSlider />
            </div>
          </div>

          {/* Right side with sign in form */}
          <div className="flex w-full flex-col items-center justify-center p-4 md:w-1/2 md:p-6">
            {/* Logo for mobile view */}
            <div className="mb-4 flex items-center space-x-2 md:hidden">
              <Icons.logo className="size-5" />
              <p className="text-sm font-bold">edux/ai</p>
            </div>

            <Button
              onClick={() => {
                router.push("/sign-up");
              }}
              className="absolute right-4 top-4 bg-transparent px-3 py-1.5 font-light text-sm text-foreground shadow-none hover:bg-foreground/10"
            >
              Sign up
            </Button>

            <CardHeader className="space-y-1 text-center">
              <CardTitle className="p-4 text-xl font-thin sm:text-2xl">
                Sign in to your account
              </CardTitle>
            </CardHeader>

            <CardContent className="flex w-full flex-col items-center justify-center">
              <form className="flex w-full flex-col items-center justify-center">
                <div className="grid w-5/6 items-center gap-4">
                  <div className="flex w-full flex-col space-y-1.5">
                    <div className="relative w-full">
                      <Envelope className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-gray-400" />
                      <Input
                        type="text"
                        placeholder="email@example.com"
                        className="px-10 font-light"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                    <div className="relative w-full">
                      <LockWaves className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-gray-400" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="********"
                        className="px-10 font-light"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 size-7 -translate-y-1/2 text-gray-400"
                        onClick={togglePasswordVisibility}
                      >
                        {showPassword ? (
                          <EyeSlash className="size-4" />
                        ) : (
                          <Eye className="size-4" />
                        )}
                        <span className="sr-only">
                          {showPassword ? "Hide password" : "Show password"}
                        </span>
                      </Button>
                    </div>
                    <div className="flex w-full justify-end">
                      <Button
                        type="button"
                        variant="link"
                        className="h-auto p-0 text-xs font-light text-foreground/70 hover:text-foreground"
                        onClick={() => router.push("/forgot-password")}
                      >
                        Forgot password?
                      </Button>
                    </div>
                  </div>
                </div>
              </form>
            </CardContent>

            <CardFooter className="flex w-full justify-center">
              <Button className="w-5/6 font-light" onClick={handleSignIn}>
                Sign in
              </Button>
            </CardFooter>

            <CardContent className="flex w-full flex-col items-center justify-center">
              <div className="grid w-5/6 items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t"></span>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 font-light text-muted-foreground">
                      Or continue with
                    </span>
                  </div>
                </div>
                <Button
                  className="inline-flex items-center justify-center space-x-2 whitespace-nowrap rounded-md border border-input bg-background px-4 py-2 text-sm font-light text-accent-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                  onClick={handleGoogleSignIn}
                >
                  <FcGoogle />
                  <span>Google</span>
                </Button>
              </div>
            </CardContent>

            <CardFooter className="flex w-full justify-center">
              <p className="w-4/5 text-center text-xs font-light text-foreground/60">
                By clicking continue, you agree to our{" "}
                <a
                  className="text-foreground/60 underline hover:text-foreground/80"
                  href=""
                >
                  Terms of Service
                </a>{" "}
                and{" "}
                <a
                  className="text-foreground/60 underline hover:text-foreground/80"
                  href=""
                >
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
