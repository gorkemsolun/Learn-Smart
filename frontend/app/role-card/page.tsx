"use client";

import { Navbar } from "@/components/navbar";
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
    await backendAPI
      .get("/users/me", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => {
        setUserID(response.data.user_id);
      });
  }, [token]);

  useEffect(() => {
    if (!token) {
      router.replace("/sign-in");
    } else {
      fetchUserData();
    }
  }, [token, router, userID, fetchUserData]);

  const handleUserRoleSelection = (role: string) => {
    setSelectedUserRole(role);
  };

  const handleRoleSelection = async () => {
    if (selectedUserRole === null) {
      toast({
        title: "Please select a role",
        description: "You have to choose a role to proceed",
        variant: "destructive",
        action: <ToastAction altText="Try again">Try again</ToastAction>,
      });
    } else {
      await backendAPI
        .put(
          `/users/update`,
          {
            role: selectedUserRole,
            user_id: userID,
          },
          {
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        )
        .then((response) => {
          if (response) {
            if (selectedUserRole == "Instructor")
              router.replace("/edux-homepage-instructor");
            else router.replace("/edux-homepage");
          }
        })
        .catch((error) => {
          console.error("Role selection:", error);
          toast({
            title: "An error occurred.",
            description: "Sorry for the inconvience.",
            variant: "destructive",
            action: <ToastAction altText="Try again">Try again</ToastAction>,
          });
        });
    }
  };

  return (
    <main>
      <Navbar />
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <Card className="relative flex h-[48vh] w-2/5 flex-col justify-between overflow-auto p-4">
          <div className="flex flex-col">
            <CardHeader>
              <CardTitle>Choose Your Role</CardTitle>
            </CardHeader>
          </div>

          <CardContent className="flex-col-2 flex space-x-4">
            {userRoles.map((userRole) => (
              <Card
                key={userRole.role}
                className={`cursor-pointer shadow transition-transform${
                  selectedUserRole === userRole.role
                    ? "ring-2 ring-blue-500"
                    : ""
                } rounded-xl`}
                onClick={() => handleUserRoleSelection(userRole.role)}
              >
                <CardHeader className="bg-foreground/10 mb-4 rounded-t-xl">
                  <CardTitle>{userRole.role}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{userRole.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </CardContent>

          <div className="mb-6 mr-6 flex justify-end">
            <Button onClick={handleRoleSelection} className="w-1/5">
              Submit
            </Button>
          </div>
        </Card>
      </div>
    </main>
  );
}
