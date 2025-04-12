"use client";

import { Sidebar } from "./sidebar";
import { ChatArea } from "./chat-area";

export default function ChatLayout() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <ChatArea />
    </div>
  );
}