// chat-area.tsx
'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Paperclip, Send } from "lucide-react";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";
import { FileUploadModal } from "@/components/file-upload-modal";
import { Message, Project } from "@/app/types";

export function ChatArea({ 
  project,
  onNewMessage
}: { 
  project: Project;
  onNewMessage: (message: Message) => void;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [message, setMessage] = useState('');

  const handleFileUpload = (files: File[]) => {
    console.log("Files to upload:", files);
  };

  const handleSendMessage = () => {
    if (message.trim()) {
      const newMessage: Message = {
        message_id: Date.now(),
        role: "user",
        text: message,
      };
      onNewMessage(newMessage);
      setMessage('');
      
      // Simulate model response
      setTimeout(() => {
        const modelResponse: Message = {
          message_id: Date.now(),
          role: "model",
          text: `I received your message about "${message}" in project ${project.name}`,
        };
        onNewMessage(modelResponse);
      }, 1000);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-background">
      <FileUploadModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUpload={handleFileUpload}
      />

      <Card className="rounded-none border-b">
        <CardHeader className="py-4">
          <h1 className="text-xl font-semibold">{project.name}</h1>
        </CardHeader>
      </Card>

      <ScrollArea className="flex-1">
        <div className="p-4">
          <div className="max-w-3xl mx-auto">
            {project.messages.length > 0 ? (
              <div className="space-y-4">
                {project.messages.map((msg) => (
                  <div 
                    key={msg.message_id} 
                    className={`flex ${msg.role === "user" ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] rounded-lg px-4 py-2 ${msg.role === "user" ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                      {msg.text}
                      {msg.media_url && (
                        <div className="mt-2">
                          <img src={msg.media_url} alt="Media" className="max-w-full rounded" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Card className="border-0 shadow-none">
                <CardContent className="flex flex-col items-center justify-center min-h-[60vh] text-center text-muted-foreground p-8">
                  <Avatar className="h-16 w-16 mb-4">
                    <AvatarImage src="/bot-icon.png" />
                    <AvatarFallback>Bot</AvatarFallback>
                  </Avatar>
                  <h3 className="text-lg font-medium mb-2">New chat in {project.name}</h3>
                  <p className="text-sm mb-6">Chats in this project can access file content</p>
                  <p className="text-sm mb-6">Send a message to start chatting</p>
                  
                  <div className="flex space-x-4">
                    <Button 
                      variant="outline"
                      onClick={() => setIsModalOpen(true)}
                    >
                      <Paperclip className="mr-2 h-4 w-4" />
                      Add files
                    </Button>
                    <Button variant="outline">
                      Add instructions
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </ScrollArea>

      <Card className="rounded-none border-t">
        <CardFooter className="p-4">
          <div className="max-w-3xl w-full mx-auto">
            <div className="relative">
              <Input
                placeholder={`Message in ${project.name}...`}
                className="pr-12"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <Button
                size="icon"
                variant="ghost"
                className="absolute right-2 top-1/2 -translate-y-1/2"
                onClick={handleSendMessage}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              The assistant can make mistakes. Consider checking important information.
            </p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}