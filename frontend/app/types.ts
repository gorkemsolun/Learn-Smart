import { HierarchyNode, SimulationNodeDatum } from "d3";
import { List } from "postcss/lib/list";
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
  course_id?: string;
  course_name: string;
  course_code: string;
  course_description: string;
  course_icon_fid?: string;
  course_syllabus_fid?: string;
  course_syllabus?: File;
  course_icon?: File;
}

export interface Message {
  role: "user" | "assistant";
  text: string;
  media_urls?: string[];
  media_types?: string[];
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
  messages: Message[];
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleInputFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isChatLoading: boolean;
  chatContainerRef: React.RefObject<HTMLDivElement>;
  activeChat: Chat | null;
  showToggleSidebarButton: boolean;
  setIsSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
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
  token: string;
  course: Course;
  onCourseDelete: (courseId: string) => void;
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

export interface NodeData {
  id: string;
  label: string;
  group: number;
  completed: boolean;
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

export interface SkillTreeCreateDialogProps {
  isOpen: boolean;
  onClose: (value: boolean) => void;
  onSkillTreeCreation: () => void;
}

export interface SkillTreeCreateProps {
  onSkillTreeUpdate: () => void;
}

export interface SkillTreeCardProps {
  id: string;
  title: string;
  description: string;
  onSkillTreeDelete: (id: string) => void;
}

export interface SkillTreeEditDialogProps {
  isOpen: boolean;
  onClose: (value: boolean) => void;
  onSkillTreeUpdate: () => void;
  skillTree: SkillTreeCard;
}
