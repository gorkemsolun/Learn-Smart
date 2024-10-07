"use client";

import React, { useState } from "react";
import { Message } from "../../../../types";

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  };

  const handleSendMessage = () => {
    if (inputValue.trim() !== "") {
      const newMessage: Message = {
        message_id: messages.length + 1,
        text: inputValue,
        role: "user",
        media_url: null,
      };

      setMessages([...messages, newMessage]);
      setInputValue("");
    }
  };

  return (
    <div>
      <div>
        {messages.map((message) => (
          <div key={message.message_id}>
            <strong>{message.role}: </strong>
            {message.text}
          </div>
        ))}
      </div>
      <div>
        <input
          placeholder="Type a message..."
          type="text"
          value={inputValue}
          onChange={handleInputChange}
        />
        <button onClick={handleSendMessage} type="button">
          Send
        </button>
      </div>
    </div>
  );
}
