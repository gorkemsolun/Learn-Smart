"use client";

import { SkillTree } from "@/app/types";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { SkillTreeEditCreateDialogModal } from "@/components/skill-tree/skill-tree-edit-create-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
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
import { Pencil1Icon, Pencil2Icon, TrashIcon } from "@radix-ui/react-icons";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { VscDebugRestart } from "react-icons/vsc";

// Here it should fetch the data about the selected skill tree from the backend, then display it.
const skillTrees: SkillTree[] = [
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
  const [openSkillTreeEditCreateDialog, setOpenSkillTreeEditCreateDialog] =
    useState(false);

  const router = useRouter();

  function onSkillTreeDelete(id: string): void {
    throw new Error("Function not implemented.");
  }

  function setSkillTreeEditDialogOpen(arg0: boolean): void {
    throw new Error("Function not implemented.");
  }

  // Implement the handleCardClick function. This should fetch the data about the selected skill tree from the backend, then display it.
  /* function handleCardClick(link: string) {
    setDummySkillTreeData(!dummySkillTreeData);
    console.log("Card clicked", link);
  } */

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
                className="flex-none cursor-pointer"
                onClick={() => {
                  setOpenSkillTreeEditCreateDialog(
                    !openSkillTreeEditCreateDialog
                  );
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
          <div className="from-background to-secondary/10 ml-0.5 space-y-4 bg-gradient-to-br p-1">
            <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {skillTrees.map((tree) => (
                <Card
                  key={tree.id}
                  className="group h-[25vh] overflow-hidden transition-all duration-300 hover:shadow-lg"
                >
                  <CardContent className="flex h-full flex-col justify-between p-0">
                    <div className="from-primary/5 via-secondary/5 to-background space-y-2 bg-gradient-to-br p-6">
                      <CardTitle className="line-clamp-1 overflow-hidden text-xl font-bold">
                        {tree.title}
                      </CardTitle>
                      <p className="text-muted-foreground line-clamp-1 overflow-hidden text-sm">
                        {tree.description || "No description available"}
                      </p>
                    </div>
                    <div className="bg-muted/50 flex items-center justify-between p-4">
                      <div className="flex items-center space-x-2">
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => setOpenSkillTreeEditCreateDialog(true)}
                        >
                          <Pencil2Icon />
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => {
                            console.log("TODO on Reset");
                          }}
                        >
                          <VscDebugRestart />
                        </Button>
                        <ConfirmationDialog
                          title={`Confirm Deleting Skill Tree "${tree.title}"`}
                          description={`Are you sure you want to delete the skill tree named "${tree.title}"? This action cannot be undone.`}
                          triggerButtonLabel={<TrashIcon />}
                          onConfirm={() => onSkillTreeDelete(tree.id)}
                        />
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="opacity-0 transition-opacity group-hover:opacity-100"
                        onClick={() => {
                          router.push(`/skill-tree/${tree.id}`);
                        }}
                      >
                        View <ChevronRight className="ml-2 size-4" />
                      </Button>
                    </div>
                  </CardContent>

                  <SkillTreeEditCreateDialogModal
                    isOpen={openSkillTreeEditCreateDialog}
                    onClose={() => setSkillTreeEditDialogOpen(false)}
                    onSkillTreeSubmit={() => {
                      console.log("TODO on SkillTreeUpdate");
                    }}
                    skillTree={tree}
                    isEdit={true}
                  />
                </Card>
              ))}
            </div>
          </div>
          <SkillTreeEditCreateDialogModal
            isOpen={openSkillTreeEditCreateDialog}
            onClose={() => setOpenSkillTreeEditCreateDialog(false)}
            onSkillTreeSubmit={() => console.log("TODO Skill Tree Created")}
            isEdit={false}
          />
        </main>
      </SidebarProvider>
    </div>
  );
}
