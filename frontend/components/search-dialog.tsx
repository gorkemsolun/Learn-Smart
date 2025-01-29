import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {DialogTitle} from "@/components/ui/dialog";
import HubIcon from '@mui/icons-material/Hub';
import ChatIcon from '@mui/icons-material/Chat';
import PersonIcon from '@mui/icons-material/Person';
import { useEffect, useState } from "react";

export function SearchDialogModal({ isOpen, onClose }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <CommandDialog open={open || isOpen} onOpenChange={(isOpen) => {
        setOpen(isOpen);
        onClose?.(isOpen);
      }}
    >
      <DialogTitle></DialogTitle>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Features">
          <CommandItem>
            <HubIcon />
            <span>Skill Tree</span>
          </CommandItem>
          <CommandItem>
            <ChatIcon />
            <span>Chat</span>
          </CommandItem>
          <CommandItem>
            <PersonIcon />
            <span>Profile</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
