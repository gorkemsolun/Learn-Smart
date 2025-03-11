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
import {useRouter} from "next/navigation";

export function SearchDialogModal({ isOpen, onClose }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const handleNavigation = async (path) => {
    setOpen(false);
    onClose?.(false);
    await router.replace(path);
  };

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
          <CommandItem asChild>
            <button
              onClick={() => handleNavigation("/skill-tree")}
              className="flex w-full cursor-pointer items-center gap-2 text-left"
            >
              <HubIcon />
              <span>Skill Tree</span>
            </button>
          </CommandItem>
          <CommandItem asChild>
            {/* TO-DO update the router path */}
            <button
              onClick={() => handleNavigation("/edux-homepage")}
              className="flex w-full cursor-pointer items-center gap-2 text-left"
            >
              <ChatIcon />
              <span>Chat</span>
            </button>
          </CommandItem>
          <CommandItem asChild>
            {/* TO-DO update the router path */}
            <button
              onClick={() => handleNavigation("/edux-homepage")}
              className="flex w-full cursor-pointer items-center gap-2 text-left"
            >
              <PersonIcon />
              <span>Profile</span>
            </button>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
