import { HierarchyNode, SimulationNodeDatum } from "d3";
import { ReactNode } from "react";

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
  course_icon_url: string;
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
  slides_mode: boolean;
  last_opened_slide_id: string | null;
  slides: Slide[];
  created_at: string;
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
  messages: Message[]
  input: string
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  isChatLoading: boolean
  chatContainerRef: React.RefObject<HTMLDivElement>
  activeChat: Chat | null
  showToggleSidebarButton: boolean
  setIsSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>
}

export interface CourseCreateDialogProps {
  isOpen: boolean;
  onClose: (value: boolean) => void;
  onCourseCreation: () => void;
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
  onCourseDelete: (courseId: string) => void;
  onCourseUpdate: () => void;
}

export interface CourseEditDialogProps {
  isOpen: boolean;
  onClose: (value: boolean) => void;
  onCourseUpdate: () => void;
  course: Course;
}

export interface NodeData {
  id: string;
  label: string;
  group: number;
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

