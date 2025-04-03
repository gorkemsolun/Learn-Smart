"use client";

import { CheckPasswordDialog } from "@/components/check-password-dialog";
import TierCardMini from "@/components/subscription-tier-card-mini-preview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { backendAPI } from "@/environment/backend_api";
import Cookies from "js-cookie";
import Image from "next/image";
import { useEffect, useState } from "react";
import { User } from "../types";

export default function Profile() {
  const [token, setToken] = useState<string>(
    Cookies.get("authToken") as string
  );
  const [editMode, setEditMode] = useState<boolean>(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState<boolean>(false);
  const [user, setUser] = useState<User>({
    user_id: "",
    role: "",
    nickname: "",
    email: "",
    password: "",
    created_at: "",
  });

  useEffect(() => {
    fetchUserData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchUserData() {
    await backendAPI
      .get("/users/me", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => {
        setUser(response.data);
      });
  }

  async function handleEditProfile(
    user_id: string,
    name: string,
    nickname: string,
    email: string,
    password: string
  ) {
    if (editMode) {
      // TODO ADD HERE THE SAVING LOGIC
      setEditMode(false);
    } else {
      // Instead of immediately entering edit mode, show the check password dialog.
      setShowPasswordDialog(true);
    }
  }

  return (
    <div className="flex size-full flex-col items-center justify-center">
      <div className="mt-4 flex items-center justify-center sm:mt-6 md:mt-8 lg:mt-10">
        <div className="mx-4 flex basis-32 items-center justify-between p-2 sm:mx-8 md:mx-16 lg:mx-32">
          <Image
            src="https://www.w3schools.com/howto/img_avatar.png"
            alt="Profile photo"
            className="m-1 max-h-32 max-w-32 basis-64 rounded-full border-4 border-white sm:m-2"
            width={256}
            height={256}
          />

          <div className="m-1 flex basis-64 flex-col items-center justify-center sm:m-2">
            <h1 className="text-3xl font-bold">{user.nickname}</h1>
            <a href="#" className="font-semibold text-gray-600">
              {user.email}
            </a>
            <hr className="mt-2" />
          </div>
        </div>
        <div className="mx-4 flex basis-full flex-col items-center justify-center p-2 sm:mx-8 md:mx-16 lg:mx-32">
          <h1 className="text-2xl font-bold">Subscription Plan</h1>
          <TierCardMini
            tier={{
              name: "Edux+ Elite",
              price: 41.54,
              billingPeriod: "monthly",
              llm: "GPT-3.5",
              features: [
                "Feature 1",
                "Feature 2",
                "Feature 3",
              ],
            }}
          />
        </div>
      </div>
      <div className="mt-4 flex w-full items-center justify-end sm:mt-6 md:mt-8 lg:mt-10">
        <Button
          variant="ghost"
          onClick={() => {
            handleEditProfile(
              user.user_id,
              "name",
              "nickname",
              "email",
              "password"
            );
          }}
          className="hover:text-primary-dark text-primary mr-4 transition-colors sm:mr-8 md:mr-16 lg:mr-32"
        >
          {editMode ? "Save Changes" : "Edit Profile"}
        </Button>
      </div>
      <div className="mt-4 flex w-full items-start justify-start sm:mt-6 md:mt-8 lg:mt-10">
        <div className="mx-4 p-4 sm:mx-8 md:mx-16 lg:mx-32">
          <div className="mb-2 sm:mb-4">
            <label className="text-foreground/70 text-xs font-semibold">
              Username
            </label>
            <Input
              id="username"
              type="text"
              value={user.nickname}
              onChange={(e) => setUser({ ...user, nickname: e.target.value })}
              required
              disabled={!editMode}
            />
          </div>

          <div>
            <label className="text-foreground/70 text-xs font-semibold">
              Password
            </label>
            <Input
              id="password"
              type="password"
              value={user.password}
              onChange={(e) => setUser({ ...user, password: e.target.value })}
              required
              disabled={!editMode}
            />
          </div>
        </div>
        <div className="flex flex-col justify-start p-4">
          <div>
            <label className="text-foreground/70 text-xs font-semibold">
              Email
            </label>
            <Input
              id="email"
              type="text"
              value={user.email}
              onChange={(e) => setUser({ ...user, email: e.target.value })}
              required
              disabled={!editMode}
            />
          </div>
        </div>
      </div>

      {showPasswordDialog && (
        <CheckPasswordDialog
          isOpen={showPasswordDialog}
          onClose={() => setShowPasswordDialog(false)}
          onCheckSuccess={() => {
            setEditMode(true);
            setShowPasswordDialog(false);
          }}
        />
      )}
    </div>
  );
}
