"use client";

import { Card, CardDescription, CardTitle } from "@/components/ui/card";
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
import HubIcon from "@mui/icons-material/Hub";
import { ChevronDownIcon } from "@radix-ui/react-icons";
import { useState } from "react";
import SkillTree from "./skill-tree";

// Here it should fetch the data about the selected skill tree from the backend, then display it.
const cardData = [
  {
    title: "Skill Tree",
    content: "Conquer each skill, reveal new branches and quizzes.",
    icon: <HubIcon />,
    link: "/skill-tree",
  },
  {
    title: "Skill Tree",
    content: "Conquer each skill, reveal new branches and quizzes.",
    icon: <HubIcon />,
    link: "/skill-tree",
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

  // Implement the handleCardClick function. This should fetch the data about the selected skill tree from the backend, then display it.
  function handleCardClick(link: string) {
    setDummySkillTreeData(!dummySkillTreeData);
    console.log("Card clicked", link);
  }

  return (
    <SidebarProvider defaultOpen={true} className="h-64">
      <Sidebar variant="floating" className="z-50">
        <SidebarHeader className="flex-col content-center justify-items-center self-center">
          <div className="text-lg">Skill Tree</div>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton>
                    SELECTED COURSE
                    <ChevronDownIcon className="ml-auto" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[--radix-popper-anchor-width]">
                  <DropdownMenuItem>
                    <span>Course 1</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <span>Course 1</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>selected courses skill trees</SidebarGroupLabel>
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

      <main className="flex-1">
        <SidebarTrigger />
        {!dummySkillTreeData ? (
          <div className="grid h-[25vh] grid-cols-4 gap-4">
            {cardData.map((card, index) => (
              <Card
                key={index}
                onClick={() => handleCardClick(card.link)}
                className="h-full cursor-pointer transition-shadow duration-300
                  hover:shadow-lg"
              >
                <div className="from-primary/5 via-secondary/5 to-background flex h-full items-center rounded-xl bg-gradient-to-br p-6">
                  <div className="grow space-y-2">
                    <CardTitle className="text-xl font-bold">
                      {card.title}
                    </CardTitle>
                    <CardDescription className="text-muted-foreground text-sm">
                      {card.content}
                    </CardDescription>
                  </div>
                  <div
                    className="bg-primary/10 text-primary ml-4 flex size-12 shrink-0 items-center justify-center rounded-full"
                    aria-hidden="true"
                  >
                    {card.icon}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <SkillTree />
        )}
      </main>
    </SidebarProvider>
  );
}
