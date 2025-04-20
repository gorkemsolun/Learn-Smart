"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ToastAction } from "@/components/ui/toast";
import { backendAPI } from "@/environment/backend_api";
import { toast } from "@/hooks/use-toast";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const userRoles = [
  {
    role: "User",
    description: "Unlock your potential, one click at a time.",
  },
  {
    role: "Instructor",
    description: "Inspire, guide, and benefit from edux.",
  },
];

export default function RoleSelectorCard() {
  const [selectedUserRole, setSelectedUserRole] = useState<string | null>(null);
  const [userID, setUserID] = useState<string | null>(null);
  const [token] = useState<string>(Cookies.get("authToken") as string);
  const router = useRouter();

  const fetchUserData = useCallback(async () => {
    const response = await backendAPI.get("/users/me", {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    setUserID(response.data.user_id);
  }, [token]);

  useEffect(() => {
    if (!token) {
      router.replace("/sign-in");
    } else {
      fetchUserData();
    }
  }, [token, router, fetchUserData]);

  const handleUserRoleSelection = (role: string) => {
    setSelectedUserRole(role);
  };

  const handleRoleSelection = async () => {
    if (!selectedUserRole) {
      return toast({
        title: "Please select a role",
        description: "You have to choose a role to proceed",
        variant: "destructive",
        action: <ToastAction altText="Try again">Try again</ToastAction>,
      });
    }

    try {
      await backendAPI.put(
        `/users/update`,
        { role: selectedUserRole, user_id: userID },
        {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      router.replace(
        selectedUserRole === "Instructor"
          ? "/edux-homepage-instructor"
          : "/edux-homepage"
      );
    } catch (error) {
      console.error("Role selection:", error);
      toast({
        title: "An error occurred.",
        description: "Sorry for the inconvenience.",
        variant: "destructive",
        action: <ToastAction altText="Try again">Try again</ToastAction>,
      });
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <Card className="flex flex-col justify-between space-y-6 p-6">
          <CardHeader>
            <CardTitle className="text-center">Choose Your Role</CardTitle>
          </CardHeader>

          {/* Responsive two‑column on md+, single‑col on sm */}
          <CardContent className="flex flex-col space-y-4 md:flex-row md:space-x-4 md:space-y-0">
            {userRoles.map((userRole) => (
              <Card
                key={userRole.role}
                onClick={() => handleUserRoleSelection(userRole.role)}
                className={`
                  flex-1 cursor-pointer rounded-xl border shadow transition-transform duration-200
                  ${
                    selectedUserRole === userRole.role
                      ? "scale-105 ring-2 ring-blue-500"
                      : "hover:scale-105"
                  }
                `}
              >
                <CardHeader className="rounded-t-xl">
                  <CardTitle className="text-center">{userRole.role}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center">
                    {userRole.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </CardContent>

          <div className="flex justify-end">
            <Button onClick={handleRoleSelection}>Submit</Button>
          </div>
        </Card>
      </div>
    </main>
  );
}
