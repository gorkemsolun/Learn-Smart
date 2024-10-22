"use client";

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { ChatSidebar } from "./chat-sidebar";

export default function ChatPage() {
  const router = useRouter();
  const params = useParams<{ chat_id: string; course_id: string }>();
  const { course_id, chat_id } = params;

  useEffect(() => {
    if (course_id && chat_id) {
    }
  }, [course_id, chat_id]);

  function fetchChat() {
    // TODO: Fetch chat data
  }

  return (
    <div>
      {/* Sidebar */}
      <div>
        <SidebarProvider>
          <ChatSidebar />
          <SidebarTrigger />
        </SidebarProvider>
      </div>
    </div>
  );
}
