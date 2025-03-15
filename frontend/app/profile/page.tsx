"use client";

import { CheckPasswordDialog } from "@/components/check-password-dialog";
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
      <div className="mt-8 flex items-center justify-center">
        <div className="mx-16 flex basis-32 items-center justify-between p-2">
          <Image
            src="https://www.w3schools.com/howto/img_avatar.png"
            alt="Profile photo"
            className="m-2 max-h-32 max-w-32 basis-64 rounded-full border-4 border-white"
            width={256}
            height={256}
          />

          <div className="m-2 flex basis-64 flex-col items-center justify-center">
            <h1 className="text-3xl font-bold">{user.nickname}</h1>
            <a href="#" className="font-semibold text-gray-600">
              {user.email}
            </a>
            <hr className="full mt-2" />
          </div>
        </div>
        <div className="flex basis-full flex-col items-center justify-center p-2">
          <h1 className="text-2xl font-bold">Subscription Plan</h1>
          <div className="rounded border border-white p-2">
            lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem
            ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum
            lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum lorem
            ipsum lorem ipsum lorem ipsum lorem ipsum lorem ipsum
          </div>
        </div>
      </div>
      <div className="mt-8 flex w-full items-center justify-end">
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
          className="hover:text-primary-dark text-primary mr-16 transition-colors"
        >
          {editMode ? "Save Changes" : "Edit Profile"}
        </Button>
      </div>
      <div className="mt-8 flex w-full items-start justify-start">
        <div className="mx-32 p-4">
          <div className="mb-4">
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
