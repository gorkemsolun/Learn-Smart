'use client'

import * as React from 'react'
import { Button } from "@/components/ui/button"
import { ChevronDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageSquare, MoreHorizontal } from 'lucide-react'

type SidebarProps = {
  courses: { course_id: string, course_code: string, course_title: string }[]
  chats: { chat_id: string, chat_title: string }[]
  selectedCourse: string
  isSidebarOpen: boolean
  handleChatAction: (action: string, chatID: string) => void
  handleCourseChange: (courseID: string) => void // Action for creating a new chat
}

export const Sidebar: React.FC<SidebarProps> = ({
  courses,
  chats,
  selectedCourse,
  isSidebarOpen,
  handleChatAction,
  handleCourseChange,
}) => {

  return (
    <aside
      className={`fixed left-0 top-0 z-40 h-screen w-64 transform transition-transform duration-300 ease-in-out ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="flex h-full flex-col">
        <div className="p-4 space-y-4">
          <Button variant="outline" className="w-full" onClick={() => handleChatAction("create", "")}>
            Create Course
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                {selectedCourse}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>Select Course</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {courses.map((course) => (
                <DropdownMenuItem key={course.course_id} onClick={() => handleCourseChange(course.course_id)}>
                  <b>{course.course_code}:</b>&nbsp;{course.course_title}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <ScrollArea className="flex-1">
          <div className="space-y-2 p-4">
            {chats.map((chat) => (
              <div
                key={chat.chat_id}
                className="flex items-center justify-between rounded-lg p-2 hover:bg-gray-200 dark:hover:bg-gray-700"
                onClick={() => handleChatAction('select', chat.chat_id)}
              >
                <span className="flex items-center">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  {chat.chat_title}
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={(e) => e.stopPropagation()} // Stop propagation for the button
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[160px]">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        handleChatAction('rename', chat.chat_id);
                      }}
                    >
                      Rename chat
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        handleChatAction('create-quiz', chat.chat_id);
                      }}
                    >
                      Create quiz
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        handleChatAction('create-flashcards', chat.chat_id);
                      }}
                    >
                      Create flashcards
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        handleChatAction('delete', chat.chat_id);
                      }}
                      className="text-red-600"
                    >
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </aside>
  )
}
