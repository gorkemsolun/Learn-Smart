// sidebar.tsx
'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { useState } from "react";
import { NewProjectModal } from "@/components/new-project-modal";
import { Project } from "@/app/types";

export function Sidebar({ 
  projects,
  currentProjectId,
  onProjectSelect,
  onProjectCreate,
}: { 
  projects: Project[];
  currentProjectId: string;
  onProjectSelect: (id: string) => void;
  onProjectCreate: (name: string) => void;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-64 border-r bg-background p-4 flex flex-col h-full">
      <NewProjectModal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        onCreate={onProjectCreate}
      />

      <div className="flex justify-between items-center mb-6">
        <Button 
          variant="ghost" 
          className="w-full justify-start"
          onClick={() => setIsNewProjectModalOpen(true)}
        >
          <span className="font-semibold">New project</span>
          <Plus className="ml-2 h-4 w-4" />
        </Button>
      </div>

      <div className="mb-6">
        <Input 
          placeholder="Search projects..." 
          className="mb-4" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="mt-auto flex-1 overflow-auto">
        <div className="text-xs text-muted-foreground mb-2">Projects</div>
        <div className="space-y-1">
          {filteredProjects.map((project) => (
            <Button 
              key={project.id}
              variant={currentProjectId === project.id ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => onProjectSelect(project.id)}
            >
              {project.name}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}