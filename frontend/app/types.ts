import { HierarchyNode, SimulationNodeDatum } from "d3";
import React, { ReactNode } from "react";

export interface User {
  user_id: string;
  role: string;
  nickname: string;
  email: string;
  password: string;
  created_at: string;
}

export interface Course {
  course_id?: string;
  course_name: string;
  course_code: string;
  course_description: string;
  course_icon_url?: string;
  course_syllabus_url?: string;
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
  message_id: number;
  role: "user" | "model";
  text: string;
  media_url?: string | null;
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
  slides_file_url?: string;
  pages_count: number;
  last_slide_number: number;
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

export interface CoursesListProps {
  courses: Course[];
  onCourseDelete: () => void;
  setCourseDialog: (value: boolean) => void;
  onCourseUpdate: () => void;
}

export interface ConfirmationDialogProps {
  title: string;
  description: string;
  onConfirm: () => void;
  triggerButtonLabel: ReactNode;
}

export interface CourseCardProps {
  course: Course;
  onCourseDelete: (courseId: string | undefined) => void;
  onCourseUpdate: () => void;
}

export interface CourseDialogProps {
  isCreate: boolean;
  isOpen: boolean;
  onClose: (value: boolean) => void;
  onCourseUpdate: () => void;
  onCourseCreation?: () => void;
  course?: Course;
}

export interface LinkData {
  source: string;
  target: string;
}

export interface CustomSimulationNode
  extends SimulationNodeDatum,
    HierarchyNode<NodeData> {
  id: string;
  label: string;
  group: number;
}

export interface SkillTree {
  id: string;
  title: string;
  nodes: NodeData[];
  nodeLinks: LinkData[];
}

export interface SkillTreeCard {
  id: string;
  title: string;
  description: string;
}

export interface SkillTreeListProps {
  skillTrees: SkillTreeCard[];
}

export interface SkillTreeCreateProps {
  onSkillTreeSubmit: () => void;
}

export interface SkillTreeCardProps {
  id: string;
  title: string;
  description: string;
  onSkillTreeDelete: (id: string) => void;
}

export interface SkillTreeEditCreateDialogProps {
  isOpen: boolean;
  onClose: (value: boolean) => void;
  onSkillTreeSubmit: () => void;
  skillTree?: SkillTreeCard;
  isEdit?: boolean;
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

export interface ChatDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onChatAction: (chat?: Chat) => void;
  chat?: Chat | null;
  mode: "create" | "edit";
}

export interface ChatMessage {
  message_id: number;
  is_user: boolean;
  content: string;
}

export interface ChatHistoryResponse {
  history: ChatMessage[];
}

export interface SlideResponse {
  slide: string;
  history?: ChatMessage[];
}
export interface SlidePanelProps {
  imgSrc?: string
  currentSlidePage: number
  totalPages: number
  isSlidesLoading: boolean
  presentationFiles: { slide_id: string; slides_file_name: string }[]
  currentSlide: Slide
  onFileChange: (slide_id: string) => void
  onPreviousSlide: () => void
  onNextSlide: () => void
  fetchSlide: (slideID: string, pageNumber: number) => Promise<any>;
}

export interface HotkeyConfig {
  key: string
  callback: () => void
  ctrlKey?: boolean
  metaKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
}