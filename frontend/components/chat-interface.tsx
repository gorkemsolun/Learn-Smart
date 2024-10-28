import { ChatInterfaceProps } from "@/app/types"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { ScrollArea } from "./ui/scroll-area"
import { Send } from "lucide-react"
import ReactMarkdown from 'react-markdown'
import { Skeleton } from "./ui/skeleton"

export default function ChatInterface({ messages, input, handleInputChange, handleSubmit, isChatLoading, chatContainerRef, activeChat }: ChatInterfaceProps) {
  return (
    <div className="h-full p-4 flex flex-col justify-between overflow-hidden">
      {activeChat && (
        <>
          <h2 className="text-2xl font-bold mb-4">{activeChat.chat_title}</h2>
          <div className="flex gap-2 mb-4">
            <Button variant="outline" onClick={() => console.log("Create Quiz clicked")}>
              Create Quiz
            </Button>
            <Button variant="outline" onClick={() => console.log("Create Flashcards clicked")}>
              Create Flashcards
            </Button>
          </div>
        </>
      )}
      <ScrollArea className="flex-grow overflow-y-auto mb-4 border border-border rounded-lg p-4">
        {!isChatLoading && messages.map((message) => (
          <div 
            key={message.message_id} 
            className={`mb-4 p-3 rounded-lg ${
              message.role === 'user' 
                ? 'bg-primary text-primary-foreground ml-auto' 
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
        ))}
        <div ref={chatContainerRef} />
        {isChatLoading && (
          <div className="mb-2 p-2 rounded-lg bg-muted max-w-[80%]">
            <Skeleton className="h-4 w-[200px]" />
            <Skeleton className="h-4 w-[160px] mt-2" />
            <Skeleton className="h-4 w-[180px] mt-2" />
          </div>
        )}
      </ScrollArea>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          type="text"
          placeholder="Type your message..."
          value={input}
          onChange={handleInputChange}
          className="flex-grow"
        />
        <Button type="submit" disabled={isChatLoading}>
          <Send className="h-4 w-4" />
          <span className="sr-only">Send message</span>
        </Button>
      </form>
    </div>
  )
}