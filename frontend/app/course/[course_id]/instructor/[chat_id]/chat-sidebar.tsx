import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FaEllipsisH } from "react-icons/fa";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { FaChevronDown } from "react-icons/fa";

interface ChatSidebarParameters {
  isChatCreateDialogOpen: boolean;
  onChatCreateDialogClose: (isOpen: boolean) => void;
}

export function ChatSidebar(chatSidebarParameters: ChatSidebarParameters) {
  const {
    state,
    open,
    setOpen,
    openMobile,
    setOpenMobile,
    isMobile,
    toggleSidebar,
  } = useSidebar();

  function SidebarChat(parameters: { name: string }) {
    return (
      <SidebarMenuItem>
        <div className="flex place-content-center place-items-center justify-between">
          <span>{parameters.name}</span>

          {/* Popover ellipsis */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost">
                <FaEllipsisH />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-fit flex-col place-content-center place-items-center justify-center align-middle">
              <div>
                <Button variant="ghost">Create a quiz</Button>
              </div>
              <div>
                <Button variant="ghost">Create a flashcard</Button>
              </div>
              <div>
                <Button variant="ghost">Delete</Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </SidebarMenuItem>
    );
  }

  function SidebarTimetableItem(parameters: { name: string }) {
    return (
      <Accordion type="single" collapsible>
        <AccordionItem value="item-1">
          <AccordionTrigger>{parameters.name}</AccordionTrigger>
          <AccordionContent>
            <SidebarChat name="chat1" />
            <SidebarChat name="chat1" />
            <SidebarChat name="chat1" />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    );
  }

  return (
    <Sidebar variant="floating">
      <SidebarHeader />
      <SidebarContent className="p-1">
        <SidebarGroup>
          <div className="flex content-center justify-between">
            <SidebarGroupLabel className="text-xl font-semibold text-slate-100">
              Chats
            </SidebarGroupLabel>

            <SidebarMenuButton
              className="size-8"
              onClick={() =>
                chatSidebarParameters.onChatCreateDialogClose(true)
              }
            >
              <Icons.createChat />
            </SidebarMenuButton>
          </div>

          <SidebarGroupContent className="font-normal">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton>
                  Select Workspace
                  <FaChevronDown className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[--radix-popper-anchor-width]">
                <DropdownMenuItem>
                  <span>Course 1</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <SidebarMenu className="flex-col pl-4 ">
              <SidebarTimetableItem name="Today" />
              <SidebarTimetableItem name="Yesterday" />
              <SidebarTimetableItem name="Last week" />
              <SidebarTimetableItem name="Last month" />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  );
}
