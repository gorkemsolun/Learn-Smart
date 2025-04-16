'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ragSite } from "@/app/constants";
import { Plus } from "lucide-react";

export function Sidebar() {

  return (
    <div className="w-64 border-r bg-background p-4 flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <Button variant="ghost" className="w-full justify-start">
          <span className="font-semibold">New project</span>
          <Plus className="ml-2 h-4 w-4" />
        </Button>
      </div>

      <div className="mb-6">
        <Input placeholder="Search projects..." className="mb-4" />
      </div>

      <div className="mt-auto flex-1 overflow-auto">
        <div className="text-xs text-muted-foreground mb-2">Projects</div>
        <div className="space-y-1">
          <Button variant="ghost" className="w-full justify-start font-medium">
            {ragSite}
          </Button>
          {['test', 'Sup chat'].map((project) => (
            <Button key={project} variant="ghost" className="w-full justify-start">
              {project}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}