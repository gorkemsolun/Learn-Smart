import React from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import {ChatResizablePanelsProps} from "@/app/types";

export default function ChatResizablePanels({
  activeChat,
  message,
  setMessage,
  handleSendMessage,
}: ChatResizablePanelsProps){
  return (
    <ResizablePanelGroup direction="horizontal" className="flex-1">
      <ResizablePanel defaultSize={50} minSize={30} className="bg-card p-4">
        <div className="flex h-full items-center justify-center rounded-lg bg-muted/50">
          <p className="text-muted-foreground">This place will be used for slides</p>
        </div>
      </ResizablePanel>

      <ResizableHandle withHandle />

      <ResizablePanel defaultSize={50} minSize={30}>
        <div className="flex h-full flex-col">
          <Accordion type="single" collapsible className="border-b">
            <AccordionItem value="item-1" className="border-none">
              <AccordionTrigger className="px-4 py-3 text-foreground hover:no-underline">
                <span className="font-medium">
                  {activeChat ? activeChat.chat_title : "Select a chat"}
                </span>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-3 text-muted-foreground">
                {activeChat ? `Details: ${activeChat.chat_title}` : "No chat selected"}
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="flex-1 overflow-auto bg-card/50 p-4">
            {activeChat ? (
              <div className="space-y-4">
                <p className="text-foreground">Chatting in: {activeChat.chat_title}</p>
                <div className="rounded-lg bg-muted/30 p-4 text-muted-foreground">
                  No messages yet. Start the conversation!
                </div>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="text-muted-foreground">Select a chat to start</p>
              </div>
            )}
          </div>

          {activeChat && (
            <div className="border-t p-4">
              <form className="flex gap-2" onSubmit={handleSendMessage}>
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 rounded-md border bg-background px-4 py-2 text-foreground"
                />
                <Button type="submit" className="rounded-md">
                  <Send className="mr-2 size-4" />
                  Send
                </Button>
              </form>
            </div>
          )}
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};