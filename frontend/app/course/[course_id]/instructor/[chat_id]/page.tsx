"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

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
    <div className="flex">
      {/* Sidebar */}
      <SidebarProvider className="fixed left-0 top-0 z-50 h-full w-fit">
        <ChatSidebar />
        <SidebarTrigger />
      </SidebarProvider>

      {/* Chat & Slider*/}
      <div className="size-full p-1 text-white">
        <ResizablePanelGroup direction="horizontal">
          {/* Slide slider */}
          <ResizablePanel className="">
            This place will be used for slide
          </ResizablePanel>
          <ResizableHandle withHandle />

          {/* Chat */}
          <ResizablePanel>
            {/* Chat header */}
            <Accordion type="single" collapsible>
              <AccordionItem value="item-1">
                <AccordionTrigger>
                  Accordion'ed chat name and its details
                </AccordionTrigger>
                <AccordionContent>Name / Details of the chat</AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* Chat */}
            <div>This place will be used for chat</div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
