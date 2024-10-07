"use client";

import Cookies from "js-cookie";
import { useEffect, useState } from "react";
import Navbar from "../components/navbar/navbar";
import { printDebugMessage } from "../debugger";
import { User } from "../types";

export default function Settings() {
  const [token, setToken] = useState<string>(
    Cookies.get("authToken") as string
  );
  const [user, setUser] = useState<User>({
    user_id: "",
    name: "",
    nickname: "",
    email: "",
    password: "",
    created_at: "",
    courses: [],
  });

  useEffect(() => {
    printDebugMessage("Token: " + token);
  }, []);

  return (
    <div className="bg-slate-50 h-screen">
      <Navbar />
      <div className="m-auto w-96 flex flex-col justify-between bg-slate-100 p-8">
        <div className="flex justify-center content-center text-4xl">
          Settings
        </div>
      </div>
    </div>
  );
}
