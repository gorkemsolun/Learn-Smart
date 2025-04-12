'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Paperclip, Send } from "lucide-react";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";

export function ChatArea() {
  return (
    <div className="flex-1 flex flex-col bg-background">
      <Card className="rounded-none border-b">
        <CardHeader className="py-4">
          <h1 className="text-xl font-semibold">ChatGPT</h1>
        </CardHeader>
      </Card>

      <ScrollArea className="flex-1">
        <div className="p-4">
          <div className="max-w-3xl mx-auto">
            <Card className="border-0 shadow-none">
              <CardContent className="flex flex-col items-center justify-center min-h-[60vh] text-center text-muted-foreground p-8">
                <Avatar className="h-16 w-16 mb-4">
                  <AvatarImage src="/chatgpt-icon.png" />
                  <AvatarFallback>GPT</AvatarFallback>
                </Avatar>
                <h3 className="text-lg font-medium mb-2">New chat in this project</h3>
                <p className="text-sm mb-6">Chats in this project can access file content</p>
                <p className="text-sm mb-6">Chats will show up here</p>
                
                <div className="flex space-x-4">
                  <Button variant="outline">
                    <Paperclip className="mr-2 h-4 w-4" />
                    Add files
                  </Button>
                  <Button variant="outline">
                    Add instructions
                  </Button>
                </div>
                <p className="text-xs mt-4">Talker the way ChatGPT responds in this project</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </ScrollArea>

      <Card className="rounded-none border-t">
        <CardFooter className="p-4">
          <div className="max-w-3xl w-full mx-auto">
            <div className="relative">
              <Input
                placeholder="Message ChatGPT..."
                className="pr-12"
              />
              <Button
                size="icon"
                variant="ghost"
                className="absolute right-2 top-1/2 -translate-y-1/2"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              ChatGPT can make mistakes. Consider checking important information.
            </p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}