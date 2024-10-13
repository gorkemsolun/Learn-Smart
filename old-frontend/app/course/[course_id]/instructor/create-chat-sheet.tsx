import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { Chat } from "@/app/types";
import FileUpload from "@/app/components/file-upload";
import { backendAPI } from "@/environment/backend_api";
import { useParams } from "next/navigation";

interface CreateChatSheetProps {
  isOpen: boolean;
  closeModal: () => void;
  authToken: string;
  onChatCreated: (newChat: Chat) => void;
}

export function CreateChatSheet({ isOpen, closeModal, authToken, onChatCreated }: CreateChatSheetProps) {
  const [chatName, setChatName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const params = useParams<{ course_id: string }>();
  const course_id = params.course_id;

  useEffect(() => {
    if (!isOpen) {
      // Reset the form when the sheet is closed
      setChatName("");
      setFile(null);
      setErrorMessage("");
    }
  }, [isOpen]);

  const handleCreateChat = async () => {
    if (!chatName.trim()) {
      setErrorMessage("Please fill out this field.");
      return;
    }
    setErrorMessage(""); // Clear any previous error

    const formData = new FormData();
    if (file) {
      console.log("File:", file);
      formData.append("slides", file);
    }

    try {
      const response = await backendAPI.post(
        `/chat/create?course_id=${course_id}&chat_title=${chatName}`,
        formData,
        {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const newChat = response.data.chat;
      onChatCreated(newChat);
      closeModal(); // Close the sheet after successful creation
    } catch (error) {
      console.error("Error creating chat:", error);
    }
  };

  const handleChatNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChatName(e.target.value);
    if (errorMessage) {
      setErrorMessage(""); // Clear error message when the user starts typing
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={closeModal}>
      <SheetContent side={"left"}>
        <SheetHeader>
          <SheetTitle>Create a New Chat</SheetTitle>
          <SheetDescription>
            Enter a name for your new chat and click create when ready.
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 py-4">
          <div>
            <Input 
              placeholder="Chat title" 
              value={chatName} 
              onChange={handleChatNameChange}
              className={errorMessage ? "border-red-500" : ""}
            />
            {errorMessage && <p className="text-red-500 text-sm">{errorMessage}</p>}
          </div>
          {/* TODO: Large filenames are not displayed properly */}
          <FileUpload onFileChange={setFile} text="Upload slides (optional)" />
        </div>
        <div className="flex justify-end">
          <Button onClick={handleCreateChat}>
            Create Chat
          </Button>
          <Button variant="outline" onClick={closeModal} className="ml-2">
            Cancel
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
