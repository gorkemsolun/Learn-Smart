import React from "react";

export interface MarkdownContentParameters {
  markdown_content: string;
}

export interface EditProfileModalParameters {
  isOpen: boolean;
  onClose: () => void;
  onSubmitted: (
    user_id: string,
    name: string,
    nickname: string,
    email: string,
    password: string
  ) => Promise<void>;
  user: User;
}

export interface QuizParameters {
  question: string;
  choices: string[];
  answer: string;
  currentQuestionIndex: number;
  totalQuestions: number;
  onNextQuestion: (isCorrect: boolean) => void;
}

export interface Flashcard {
  flashcard_topic: string;
  flashcard_explanation: string;
}

export interface CourseCardParameters {
  course: Course;
}

export interface LoadingButtonParameters {
  type: "button" | "submit" | "reset";
  text: string;
  loadingText: string;
  disabled: boolean;
  className: string;
  handleClick: (
    event:
      | React.FormEvent<HTMLFormElement>
      | React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => Promise<void>;
}

export interface CreateCourseModalParameters {
  isOpen: boolean;
  modalTitle: string;
  onClose: () => void;
  onCourseCreation: () => void;
}

export interface EditCourseModalParameters {
  isOpen: boolean;
  onClose: () => void;
  onCourseUpdate: () => void;
  courseId: string;
}

export interface UpdateUploadSyllabusParameters {
  isOpen: boolean;
  modalTitle: string;
  onClose: () => void;
  course_id: string;
}

export interface ChatsListParameters {
  chats: Chat[];
  selectedChat: Chat;
  handleChatSelection: (chat_id: string) => void;
  removeChatFromChatList: (chat_id: string) => void;
  setChats: React.Dispatch<React.SetStateAction<Chat[]>>;
  setSelectedChat: React.Dispatch<React.SetStateAction<Chat>>;
}

export interface ChatRenameModalParameters {
  isOpen: boolean;
  closeModal: () => void;
  onSubmitted: (chat_id: string, chat_title: string) => Promise<void>;
  chat_id: string;
  chat_title: string;
}

export interface GenerateQuizModalParameters {
  isOpen: boolean;
  token: string;
  chatID: string;
  onClose: (error: any) => void;
  setQuizName: (quizName: string) => void;
}

export interface QuizModalParameters {
  isOpen: boolean;
  token: string;
  quizName: string;
  courseID: string;
  onClose: () => void;
}

export interface QuizzesPageParameters {
  courseID: string;
  courseName: string;
}

export interface QuizCardProps {
  quizName: string;
  chatTitle: string;
  onClick: () => void;
  token: string;
  courseID: string;
  onQuizNameChange: any;
  onQuizDelete: any;
}

export interface QuizData {
  chat_id: number;
  chat_title: string;
  quizzes: string[];
}

export interface CourseHomepageParameters {}

export interface NavbarNotificationsFlyoutMenuParameters {
  isOpen: boolean;
  onClose: () => void;
}

export interface ForgotPasswordModalParameters {
  closeModal: () => void;
}

export interface CreateChatModalParameters {
  authToken: string;
  isOpen: boolean;
  closeModal: () => void;
  onChatCreated: (chat: Chat) => void;
}

export interface NavbarFlyoutMenuParameters {
  isOpen: boolean;
  onClose: () => void;
}

export interface MarkdownContentParameters {
  markdown_content: string;
}

export interface FolderListParameters {
  folders: FolderType[];
  handleDrop: (item: FolderType, targetFolder: FolderType) => void;
}

export interface FolderParameters {
  folder: FolderType;
  isOpen: boolean;
  onDrop: (item: FolderType, folder: FolderType) => void;
  toggleFolder: (folderName: string) => void;
}

export interface ConfirmationModalParameters {
  isOpen: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export interface CourseCardFlyoutMenuParameters {
  isOpen: boolean;
  onClose: () => void;
  course: Course;
}

export interface FolderType {
  name: string;
  folders: FolderType[];
}

export interface Course {
  course_id: string;
  course_name: string;
  course_code: string;
  course_description: string;
  course_icon_url: string;
}

export interface ChatFieldParameters {
  selectedChat: Chat;
  token: string;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setLastMessageID: React.Dispatch<React.SetStateAction<number>>;
  lastMessageID: number;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setSlidesMode: React.Dispatch<React.SetStateAction<boolean>>;
}

export interface UploadChoiceModalParameters {
  isOpen: boolean;
  selectedChat: Chat;
  token: string;
  onClose: () => void;
  onChatUpdated: (chat: any) => void;
  onUploadFile: (file: File) => void;
  setFile: (file: File | null) => void;
  setSlidesMode: React.Dispatch<React.SetStateAction<boolean>>;
}
export interface Message {
  text: string;
  role: string;
  message_id: number;
  media_url: any;
}

export interface User {
  user_id: string;
  name: string;
  nickname: string;
  email: string;
  password: string;
  created_at: string;
  courses: Course[];
}

export interface NavbarElement {
  navbar_element_id: number;
  navbar_element_name: string;
  navbar_element_link: string;
  navbar_element_component: () => JSX.Element;
}

export interface CourseHomepageElement {
  course_homepage_element_explanation: string;
  course_homepage_element_name: string;
  course_homepage_element_router: JSX.Element;
  course_homepage_element_component: JSX.Element;
}

export interface Chat {
  chat_id: string;
  chat_title: string;
  slides_mode: boolean;
  created_at: string;
  history: Message[];
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
