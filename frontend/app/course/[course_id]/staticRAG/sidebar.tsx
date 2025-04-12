'use client';

import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { ChevronDown, Plus } from "lucide-react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

export function Sidebar() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="w-64 border-r bg-background p-4 flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <Button variant="ghost" className="w-full justify-start">
          <span className="font-semibold">New chat</span>
          <Plus className="ml-2 h-4 w-4" />
        </Button>
        
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
      </div>

      <div className="mb-6">
        <Input placeholder="Search chats..." className="mb-4" />
        
        <Collapsible defaultOpen>
          <CollapsibleTrigger className="flex items-center w-full justify-between py-2 text-sm font-medium transition-all [&[data-state=open]>svg]:rotate-180">
            <span>Today</span>
            <ChevronDown className="h-4 w-4 transition-transform duration-200" />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-1 mt-2 pl-2">
            <Button variant="ghost" className="w-full justify-start h-8">
              ChatGPT New Features
            </Button>
          </CollapsibleContent>
        </Collapsible>

        <Collapsible defaultOpen className="mt-4">
          <CollapsibleTrigger className="flex items-center w-full justify-between py-2 text-sm font-medium transition-all [&[data-state=open]>svg]:rotate-180">
            <span>Yesterday</span>
            <ChevronDown className="h-4 w-4 transition-transform duration-200" />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-1 mt-2 pl-2">
            {['New chat', 'Pouring Hot Water', 'Google Scheduled Prompts Fest...', 'Canvas Bubble Sort', 'Barlin Wettervorhersage'].map((item) => (
              <Button key={item} variant="ghost" className="w-full justify-start h-8 text-left truncate">
                {item}
              </Button>
            ))}
          </CollapsibleContent>
        </Collapsible>
      </div>

      <div className="mt-auto">
        <div className="text-xs text-muted-foreground mb-2">Projects</div>
        <div className="space-y-1">
          <Button variant="ghost" className="w-full justify-start font-medium">
            ChatGPT
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