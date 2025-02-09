"use client";

import { SkillTreeCard } from "@/app/types";
import { SkillTreeCreateDialogModal } from "@/components/skill-tree/skill-tree-create-dialog";
import SkillTreeList from "@/components/skill-tree/skill-tree-list";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Pencil1Icon } from "@radix-ui/react-icons";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

// Here it should fetch the data about the selected skill tree from the backend, then display it.
const skillTrees: SkillTreeCard[] = [
  {
    id: "1",
    title: "Basic Education Path",
    description: "Very good Skill Tree",
  },
  {
    id: "2",
    title: "Second Skill Tree",
    description: "Second good Skill Tree",
  },
];

// Menu items for the sidebar this should change based on the user's selected course. Trees will appear here.
const items = [
  {
    title: "Skill Tree 1",
    url: "#",
  },
  {
    title: "Skill Tree 2",
    url: "#",
  },
];

export default function Home() {
  const [dummySkillTreeData, setDummySkillTreeData] = useState(false);
  const [openSkillTreeCreateDialog, setOpenSkillTreeCreateDialog] =
    useState(false);

  // Implement the handleCardClick function. This should fetch the data about the selected skill tree from the backend, then display it.
  function handleCardClick(link: string) {
    setDummySkillTreeData(!dummySkillTreeData);
    console.log("Card clicked", link);
  }

  return (
    <div className="fixed inset-0 flex h-screen overflow-hidden">
      <SidebarProvider defaultOpen={true} className="mt-[7vh]">
        <Sidebar
          variant="floating"
          className="z-50 mt-[8vh] flex h-[calc(100vh-10vh)] flex-col"
        >
          <SidebarHeader className="flex-col items-center justify-center">
            <div className="flex w-full items-center justify-center px-2">
              <div className="grow py-4 text-lg font-bold">Skill Tree</div>
              <Pencil1Icon
                className="flex-none"
                onClick={() => {
                  setOpenSkillTreeCreateDialog(!openSkillTreeCreateDialog);
                }}
              />
            </div>

            <SidebarMenu className="w-full">
              <SidebarMenuItem>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton className="w-full justify-between">
                      SELECTED COURSE
                      <ChevronDown className="ml-2 size-4" />
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[--radix-popper-anchor-width]">
                    <DropdownMenuItem>
                      <span>Course 1</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <span>Course 2</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarHeader>

          <SidebarContent className="flex-1 overflow-y-auto">
            <SidebarGroup>
              <SidebarGroupLabel>
                Selected Course&#39;s Skill Trees
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <a href={item.url}>
                          <span>{item.title}</span>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <main className="w-full flex-1 p-4">
          <SidebarTrigger />
          <SkillTreeList skillTrees={skillTrees} />
          <SkillTreeCreateDialogModal
            isOpen={openSkillTreeCreateDialog}
            onClose={() => setOpenSkillTreeCreateDialog(false)}
            onSkillTreeCreation={() => console.log("TODO Skill Tree Created")}
          />
        </main>
      </SidebarProvider>
    </div>
  );
}
