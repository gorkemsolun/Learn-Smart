// page.tsx
"use client";

import { Sidebar } from "./sidebar";
import { ChatArea } from "./chat-area";
import { useState } from "react";
import { Message, Project } from "@/app/types";

export default function ChatLayout() {
  const [projects, setProjects] = useState<Project[]>([
    { 
      id: '1', 
      name: 'RAG Site', 
      messages: [
        { message_id: 1, role: "model", text: "Welcome to the RAG Site project!" },
        { message_id: 2, role: "model", text: "How can I help you with your RAG implementation?" },
      ] 
    },
    { 
      id: '2', 
      name: 'Test', 
      messages: [
        { message_id: 1, role: "model", text: "This is a test project" },
      ] 
    },
    { 
      id: '3', 
      name: 'Sup Chat', 
      messages: [
        { message_id: 1, role: "model", text: "Sup!" },
        { message_id: 2, role: "model", text: "What do you want to chat about?" },
      ] 
    },
  ]);

  const [currentProjectId, setCurrentProjectId] = useState('1');

  const currentProject = projects.find(p => p.id === currentProjectId) || projects[0];

  const handleProjectCreate = (name: string) => {
    const newProject: Project = {
      id: Date.now().toString(),
      name,
      messages: []
    };
    setProjects([...projects, newProject]);
    setCurrentProjectId(newProject.id);
  };

  const handleNewMessage = (message: Message) => {
    setProjects(projects.map(project => {
      if (project.id === currentProjectId) {
        return {
          ...project,
          messages: [...project.messages, message]
        };
      }
      return project;
    }));
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar 
        projects={projects}
        currentProjectId={currentProjectId}
        onProjectSelect={setCurrentProjectId}
        onProjectCreate={handleProjectCreate}
      />
      <ChatArea 
        project={currentProject} 
        onNewMessage={handleNewMessage}
      />
    </div>
  );
}