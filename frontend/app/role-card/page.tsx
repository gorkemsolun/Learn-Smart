"use client"

import * as React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {useEffect, useState} from "react";
import {backendAPI} from "@/environment/backend_api";
import Cookies from "js-cookie";
import {ToastAction} from "@/components/ui/toast";
import {toast} from "@/hooks/use-toast";
import {useRouter} from "next/navigation";
import {Navbar} from "@/components/navbar";

const userRoles = [
  {
    role: "User",
    description: "Unlock your potential, one click at a time.",
  },
  {
    role: "Instructor",
    description: "Inspire, guide, and benefit from learnsmart.",
  },
];

export default function RoleSelectorCard() {
  const [selectedUserRole, setSelectedUserRole] = useState<string | null>(null);
  const [userID, setUserID] = useState<string | null>(null);
  const [token] = useState<string>(
    Cookies.get("authToken") as string
  );

  const router = useRouter();

  useEffect(() => {
    if (!token) {
      router.replace("/sign-in");
    } else {
      fetchUserData();
    }
  }, [router, userID]);

  async function fetchUserData() {
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
  }

  const handleUserRoleSelection = (role: string) => {
    setSelectedUserRole(role);
  };

  const handleRoleSelection= async () => {
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
          if(response) {
            if(selectedUserRole == "Instructor")
              router.replace("/learnsmart-homepage-instructor");
            else
              router.replace("/learnsmart-homepage");
          }

        }).catch((error) => {
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
        <Navbar/>
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <Card className="p-4 relative w-2/5 h-[48vh] flex flex-col justify-between overflow-auto">
            <div className="flex flex-col">
              <CardHeader>
                <CardTitle>Choose Your Role</CardTitle>
              </CardHeader>
            </div>

            <CardContent className="flex flex-col-2 space-x-4">
              {userRoles.map((userRole) => (
                  <Card
                      key={userRole.role}
                      className={`cursor-pointer transition-transform transform shadow ${
                          selectedUserRole === userRole.role ? "ring-2 ring-blue-500" : ""
                      } rounded-xl`}
                      onClick={() => handleUserRoleSelection(userRole.role)}
                  >
                    <CardHeader className="bg-foreground/10 rounded-t-xl mb-4">
                      <CardTitle>{userRole.role}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription>{userRole.description}</CardDescription>
                    </CardContent>
                  </Card>
              ))}
            </CardContent>

            <div className="flex justify-end mb-6 mr-6">
              <Button
                  onClick={handleRoleSelection} className="w-1/5"
              >
                Submit
              </Button>
            </div>
          </Card>
        </div>
      </main>
  );
}
