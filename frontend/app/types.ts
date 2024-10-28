// variable names need to match the response from the server
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

export interface ChatInterfaceProps {
  messages: Message[]
  input: string
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  isChatLoading: boolean
  chatContainerRef: React.RefObject<HTMLDivElement>
  activeChat: Chat | null
}
