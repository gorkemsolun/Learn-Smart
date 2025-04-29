"use client";

import type React from "react";

import { useState, useRef, useEffect } from "react";
import type { ChatInterfaceProps } from "@/app/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Paperclip, File, FileText, FileImage, FileAudio, FileVideo, X, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { useGenerateFlashcard } from "@/hooks/useCreateFlashcards";
import { useGenerateQuiz } from "@/hooks/useCreateQuiz";
import { useParams } from "next/navigation";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import { Badge } from "@/components/ui/badge";
import { Message } from "@/app/types";

export default function ChatInterface({
  messages,
  input,
  handleInputChange,
  handleInputFileChange,
  handleSubmit,
  isChatLoading,
  chatContainerRef,
  activeChat,
}: ChatInterfaceProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isGeneratingFlashcards, setIsGeneratingFlashcards] = useState(false);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const token = useAuthRedirect();
  const params = useParams<{ course_id: string }>();
  const { generateFlashcard, isLoadingFlashcard, errorFlashcard, flashcardData } = useGenerateFlashcard();
  const { generateQuiz, isLoadingQuiz, errorQuiz, quizData } = useGenerateQuiz();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    const scrollArea = chatContainerRef.current?.parentElement;
    if (scrollArea) {
      const isNearBottom =
        scrollArea.scrollHeight - scrollArea.scrollTop - scrollArea.clientHeight < 100;

      if (isNearBottom || messages[messages.length - 1]?.role === "user") {
        // Use a small timeout to ensure content is rendered before scrolling
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "end",
          });
        }, 100);
      }
    }
  }, [messages, chatContainerRef]);


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (selectedFile) {
      // Reset selected file after upload
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
    handleSubmit(event);
  };

  const handleGenerateFlashcard = async () => {
    if (!activeChat) return;

    setIsGeneratingFlashcards(true);
    try {
      await generateFlashcard(params.course_id, activeChat.chat_id, token);
    } finally {
      setIsGeneratingFlashcards(false);
    }
  };

  const handleGenerateQuiz = async () => {
    if (!activeChat) return;

    setIsGeneratingQuiz(true);
    try {
      await generateQuiz(params.course_id, activeChat.chat_id, token);
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getFileIcon = (fileName: undefined | string) => {
    const extension = fileName.split(".").pop()?.toLowerCase();
    switch (extension) {
      case "pdf":
        return <FileText className="size-5" />;
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
        return <FileImage className="size-5" />;
      case "mp3":
      case "wav":
        return <FileAudio className="size-5" />;
      case "mp4":
      case "mov":
        return <FileVideo className="size-5" />;
      default:
        return <File className="size-5" />;
    }
  };

  return (
    <div className="flex h-full flex-col justify-between overflow-hidden rounded-lg bg-background">
      {/* Header */}
      <Accordion type="single" collapsible className="border-b">
        <AccordionItem value="item-1" className="border-none">
          <AccordionTrigger className="px-4 py-3 text-foreground hover:no-underline">
            <span className="font-medium">{activeChat ? activeChat.chat_title : "Select a chat"}</span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-3 text-muted-foreground">
            {activeChat ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleGenerateQuiz} disabled={isGeneratingQuiz}>
                    {isGeneratingQuiz ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      "Create Quiz"
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateFlashcard}
                    disabled={isGeneratingFlashcards}
                  >
                    {isGeneratingFlashcards ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      "Create Flashcards"
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              "No chat selected"
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Messages Area */}
      <ScrollArea className="scrollbar-hidden flex-1 p-4">
        <div className="space-y-6">
          {messages.map((message: Message, index) => (
          <div
            key={index}
            className={`mb-6 flex flex-col ${
              message.role === 'user' ? 'items-end' : 'items-start'
            }`}
          >
            {/* Render image files */}
            {message.media_urls?.map((url, idx) => {
              const mimeType = message.media_types && message.media_types[idx];
              const isImage = mimeType
                ? mimeType.startsWith('image/')
                : /\.(jpeg|jpg|gif|png|webp)$/i.test(url);

              return isImage ? (
                <div key={idx} className="mb-2">
                  <img
                    height={250}
                    width={250}
                    src={url}
                    alt="Uploaded content"
                    className="max-w-xs sm:max-w-sm h-auto rounded-lg"
                    loading="lazy"
                  />
                </div>
              ) : (
                <div key={idx} className="mb-2 flex items-center space-x-2">
                  {getFileIcon(mimeType)}
                  <a
                    href={url}
                    className="text-blue-500 hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {message.filenames && message.filenames[idx]}
                  </a>
                </div>
              );
            })}

              {/* Message content */}
              {message.text && (
                <div
                  className={`rounded-lg p-4 ${
                    message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                  } max-w-[80%]`}
                >
                  <ReactMarkdown
                    remarkPlugins={[remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                    className="prose prose-sm dark:prose-invert"
                    components={{
                      p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
                      a: ({ href, children }) => (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:underline"
                        >
                          {children}
                        </a>
                      ),
                      ul: ({ children }) => <ul className="mb-3 list-disc pl-5">{children}</ul>,
                      ol: ({ children }) => <ol className="mb-3 list-decimal pl-5">{children}</ol>,
                      li: ({ children }) => <li className="mb-1">{children}</li>,
                      h1: ({ children }) => <h1 className="mb-3 text-2xl font-bold">{children}</h1>,
                      h2: ({ children }) => <h2 className="mb-2 text-xl font-bold">{children}</h2>,
                      h3: ({ children }) => <h3 className="mb-2 text-lg font-bold">{children}</h3>,
                      code: ({ node, className, children, ...props }) => {
                        const match = /language-(\w+)/.exec(className || "");
                        return match ? (
                          <pre className="mb-3 overflow-x-auto rounded bg-background p-3 text-sm">
                            <code className={className} {...props}>
                              {children}
                            </code>
                          </pre>
                        ) : (
                          <code className="rounded bg-background px-1.5 py-0.5 text-sm" {...props}>
                            {children}
                          </code>
                        );
                      },
                    }}
                  >
                    {message.text}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          ))}

          {/* Loading indicator */}
          {isChatLoading && (
            <div className="mb-4 ml-0 max-w-[80%]">
              <Badge variant="secondary" className="mb-1">
                Assistant
              </Badge>
              <div className="rounded-lg bg-muted p-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-4 w-[150px]" />
                </div>
              </div>
            </div>
          )}

          {/* Anchor for auto-scrolling */}
          <div ref={messagesEndRef} />
          <div ref={chatContainerRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t border-border p-4">
        {selectedFile && (
          <div className="mb-2 flex items-center gap-2 rounded-md bg-muted p-2 text-sm">
            {getFileIcon(selectedFile.name)}
            <span className="flex-1 truncate">{selectedFile.name}</span>
            <Button variant="ghost" size="icon" className="size-6" onClick={clearSelectedFile}>
              <X className="size-4" />
              <span className="sr-only">Remove file</span>
            </Button>
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-y-0 left-0 flex items-center px-3 text-muted-foreground hover:text-primary focus:outline-none"
              aria-label="Upload file"
            >
              <Paperclip className="size-4" />
            </button>
            <Input
              type="text"
              placeholder="Type your message..."
              value={input}
              onChange={handleInputChange}
              className="pl-10"
              disabled={isChatLoading}
            />
            <Input
              type="file"
              onChange={(e) => {
                handleFileChange(e);
                handleInputFileChange(e);
              }}
              className="hidden"
              ref={fileInputRef}
              id="file-upload"
            />
          </div>
          <Button type="submit" disabled={isChatLoading || (!input.trim() && !selectedFile)}>
            {isChatLoading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            <span className="sr-only">Send message</span>
          </Button>
        </form>
      </div>
    </div>
  );
}

