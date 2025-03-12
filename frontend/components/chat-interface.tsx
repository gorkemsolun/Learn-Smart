import { ChatInterfaceProps } from "@/app/types"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { ScrollArea } from "./ui/scroll-area"
import { Send, Menu, Paperclip, File, FileText, FileImage, FileAudio, FileVideo } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { Skeleton } from "./ui/skeleton"
import { useState, useRef } from 'react'
import { Message } from '@/app/types'

import { backend } from "@/environment/backend_api"
import { useAuthRedirect } from "@/hooks/useAuthRedirect"
import { useGenerateFlashcard } from "@/hooks/useCreateFlashcards"

export default function ChatInterface({ 
  messages, 
  input, 
  handleInputChange,
  handleInputFileChange,
  handleSubmit, 
  isChatLoading, 
  chatContainerRef, 
  activeChat, 
  showToggleSidebarButton, 
  setIsSidebarOpen 
}: ChatInterfaceProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const token = useAuthRedirect();
  const { generateFlashcard, isLoading, error, flashcardData } = useGenerateFlashcard();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0])
    }
  }

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (selectedFile) {
      // Reset selected file after upload
      setSelectedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
    handleSubmit(event)
  }

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase()
    switch (extension) {
      case 'pdf':
        return <FileText className="h-6 w-6" />
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <FileImage className="h-6 w-6" />
      case 'mp3':
      case 'wav':
        return <FileAudio className="h-6 w-6" />
      case 'mp4':
      case 'mov':
        return <FileVideo className="h-6 w-6" />
      default:
        return <File className="h-6 w-6" />
    }
  }

  return (
    <div className="h-full p-4 flex flex-col justify-between overflow-hidden">
      {activeChat && (
        <>
          <div className="flex items-center mb-4">
            {showToggleSidebarButton && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSidebarOpen((prev) => !prev)}
                aria-label="Toggle sidebar"
              >
                <Menu className="h-6 w-6" />
              </Button>
            )}
            <h2 className="text-2xl font-bold ml-2">{activeChat.chat_title}</h2>
          </div>
          <div className="flex gap-2 mb-4">
            <Button variant="outline" onClick={() => console.log("Create Quiz clicked")}>
              Create Quiz
            </Button>
            <Button variant="outline" onClick={() => generateFlashcard(activeChat.chat_id, token)}>
              Create Flashcards
            </Button>
          </div>
        </>
      )}
      <ScrollArea className="flex-grow overflow-y-auto mb-4 border border-border rounded-lg p-4">
        {messages.map((message: Message, index) => (
          <div 
            key={index} 
            className={`mb-6 flex flex-col ${
              message.role === 'user' ? 'items-end' : 'items-start'
            }`}
          >
            {/* Render image files */}
            {message.media_urls?.map((url, idx) => {
              const isImage = url.match(/\.(jpeg|jpg|gif|png)$/i);
              
              return isImage ? (
                <div key={idx} className="mb-2">
                  <img 
                    src={url}
                    alt="Uploaded content" 
                    className="max-w-xs sm:max-w-sm h-auto rounded-lg"
                    loading="lazy"
                  />
                </div>
              ) : (
                <div key={idx} className="mb-2 flex items-center space-x-2">
                  {getFileIcon(url)}
                  <a 
                    href={url.startsWith('blob:') ? url : `${backend.getUri()}/api/public/files/${url}`}
                    className="text-blue-500 hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {url.split('/').pop()}
                  </a>
                </div>
              );
            })}
            {/* Message balloon */}
            <div 
              className={`p-3 rounded-lg ${
                message.role === 'user' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted'
              } max-w-[80%]`}
            >
              <ReactMarkdown
                components={{
                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                  a: ({ href, children }) => <a href={href} className="text-blue-500 hover:underline">{children}</a>,
                  ul: ({ children }) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
                  li: ({ children }) => <li className="mb-1">{children}</li>,
                  h1: ({ children }) => <h1 className="text-2xl font-bold mb-2">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-xl font-bold mb-2">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-lg font-bold mb-2">{children}</h3>,
                  code: ({ node, className, children, ...props }) => {
                    const match = /language-(\w+)/.exec(className || '')
                    return match ? (
                      <pre className="bg-gray-200 dark:bg-gray-800 rounded p-2 mb-2 overflow-x-auto">
                        <code className={className} {...props}>
                          {children}
                        </code>
                      </pre>
                    ) : (
                      <code className="bg-gray-200 dark:bg-gray-800 rounded px-1" {...props}>
                        {children}
                      </code>
                    )
                  },
                }}
              >
                {message.text}
              </ReactMarkdown>
            </div>
          </div>
        ))}
        {isChatLoading && (
          <div className="mb-4 p-3 rounded-lg bg-muted max-w-[80%] mr-auto">
            <Skeleton className="h-4 w-[200px]" />
          </div>
        )}
        <div ref={chatContainerRef} />
      </ScrollArea>

      <form onSubmit={handleFormSubmit} className="flex gap-2">
        <div className="relative flex-grow">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute inset-y-0 left-0 flex items-center px-3 text-muted-foreground hover:text-primary focus:outline-none"
            aria-label="Upload file"
          >
            <Paperclip className="h-4 w-4" />
          </button>
          <Input
            type="text"
            placeholder="Type your message..."
            value={input}
            onChange={handleInputChange}
            className="pl-10" // Adds padding to the left to avoid overlap
          />
          <Input
            type="file"
            onChange={(e) => {handleFileChange(e); handleInputFileChange(e)}}
            className="hidden"
            ref={fileInputRef}
            id="file-upload"
          />
        </div>
        <Button type="submit" disabled={isChatLoading}>
          <Send className="h-4 w-4" />
          <span className="sr-only">Send message</span>
        </Button>
      </form>
      {selectedFile && (
        <p className="mt-2 text-sm text-muted-foreground">
          Selected file: {selectedFile.name}
        </p>
      )}
    </div>
  );
}
