import {ReactNode} from "react";
import {HierarchyNode, SimulationNodeDatum} from "d3";

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

export interface CustomSimulationNode extends SimulationNodeDatum, HierarchyNode<NodeData> {
  id: string;
  label: string;
  group: number;
}