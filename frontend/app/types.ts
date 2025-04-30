import React from "react";

export interface User {
  user_id: string;
  role: string;
  nickname: string;
  email: string;
  password: string;
  created_at: string;
}

export interface Course {
  course_id: string;
  course_name: string;
  course_code: string;
  course_description: string;
  course_icon_fid?: string;
  course_syllabus_fid?: string;
  course_syllabus?: File;
  course_icon?: File;
}

export interface NodeData {
  id: string;
  label?: string;
  description?: string;
  level?: number;
  progress?: number;
  prerequisites?: string[];
  skills?: string[];
  completed?: boolean;
}

export interface Tier {
  name: string;
  price: number;
  billingPeriod: "monthly" | "yearly";
  llm: string;
  features: string[];
  badge?: any; // TODO: Define the type for badge
}

export interface Message {
  role: "user" | "assistant";
  text: string;
  filenames?: string[];
  media_urls?: string[];
  media_types?: string[];
}

export interface Chat {
  chat_id: string;
  chat_title: string;
  slides_mode?: boolean;
  last_opened_slide_id?: string | null;
  slides?: Slide[];
  created_at?: string;
}

export interface Slide {
  chat_id: string;
  slide_id: string;
  slides_file_name: string;
  slides_fid?: string;
  pages_count: number;
  last_opened_page_number: number;
}

export interface Notification {
  notification_id: string;
  notification_title: string;
  notification_content: string;
  notification_date: string;
  notification_is_new: boolean;
  notification_receiver_id: string;
  notification_sender_id: string;
}

export interface ChatInterfaceProps {
  messages: Message[];
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleInputFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isChatLoading: boolean;
  chatContainerRef: React.RefObject<HTMLDivElement>;
  activeChat: Chat | null;
}

export interface SkillTree {
  id: string;
  title: string;
  description: string;
}

export interface CheckPasswordDialogProps {
  isOpen: boolean;
  onClose: (open: boolean) => void;
  onCheckSuccess?: () => void;
}

export interface ChatSidebarProps {
  course: Course;
  courses: Course[];
  isLoading: boolean;
  activeChat: Chat | null;
  setActiveChat: React.Dispatch<React.SetStateAction<Chat | null>>;
  chats: Chat[];
  fetchChats: (courseId: string) => Promise<void>;
}

export interface ChatResizablePanelsProps {
  activeChat: Chat | null;
}

export interface ChatMessage {
  message_id: number;
  is_user: boolean;
  content: string;
}

export interface ChatHistoryResponse {
  history: ChatMessage[];
}

export interface SlidePanelProps {
  imgSrc?: string;
  currentSlidePage: number;
  totalPages: number;
  isSlidesLoading: boolean;
  presentationFiles: { slide_id: string; slides_file_name: string }[];
  currentSlide: Slide;
  onFileChange: (slide_id: string) => void;
  onPreviousSlide: () => void;
  onNextSlide: () => void;
  fetchSlide: (slideID: string, pageNumber: number) => Promise<SlideResponse>;
}

export interface HotkeyConfig {
  key: string;
  callback: () => void;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
}
