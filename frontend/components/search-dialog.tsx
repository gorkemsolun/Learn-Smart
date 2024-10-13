"use client";

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export function SearchDialogModal({ isOpen, onClose }) {
  const [searchTerm, setSearchTerm] = useState('');

  const handleInputChange = (event) => {
    setSearchTerm(event.target.value);
  };

  return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[512px] border-b-neutral-800">
          <DialogTitle></DialogTitle>
          <DialogDescription></DialogDescription>
          <div className="flex items-center border-b">
            <svg
                width="30"
                height="30"
                viewBox="0 0 15 15"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="mr-2 h-6 w-6 shrink-0 opacity-50"
            >
              <path
                  d="M10 6.5C10 8.433 8.433 10 6.5 10C4.567 10 3 8.433 3 6.5C3 4.567 4.567 3 6.5 3C8.433 3 10 4.567 10 6.5ZM9.30884 10.0159C8.53901 10.6318 7.56251 11 6.5 11C4.01472 11 2 8.98528 2 6.5C2 4.01472 4.01472 2 6.5 2C8.98528 2 11 4.01472 11 6.5C11 7.56251 10.6318 8.53901 10.0159 9.30884L12.8536 12.1464C13.0488 12.3417 13.0488 12.6583 12.8536 12.8536C12.6583 13.0488 12.3417 13.0488 12.1464 12.8536L9.30884 10.0159Z"
                  fill="currentColor"
                  fillRule="evenodd"
                  clipRule="evenodd"
              />
            </svg>

            <Input
                className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none
            placeholder:text-muted-foreground border-0 focus-visible:ring-0 shadow-none
            "
                placeholder="Type a command or search..."
                autoComplete="off"
                autoCorrect="off"
                spellCheck="false"
                aria-autocomplete="list"
                role="combobox"
                aria-expanded="true"
                aria-controls="suggestions"
                aria-labelledby="search-label"
                type="text"
                value={searchTerm}
                onChange={handleInputChange}
            />
          </div>
          <div className="text-[14px] text-foreground/60">Links</div>
          <div
              className="relative flex cursor-default select-none items-center
              rounded-sm py-1.5 text-sm outline-none data-[disabled=true]:pointer-events-none
              data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground
              data-[disabled=true]:opacity-50"
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"
                 className="mr-2 h-4 w-4">
              <path
                  d="M3.5 2C3.22386 2 3 2.22386 3 2.5V12.5C3 12.7761 3.22386 13 3.5 13H11.5C11.7761 13 12 12.7761 12 12.5V6H8.5C8.22386 6 8 5.77614 8 5.5V2H3.5ZM9 2.70711L11.2929 5H9V2.70711ZM2 2.5C2 1.67157 2.67157 1 3.5 1H8.5C8.63261 1 8.75979 1.05268 8.85355 1.14645L12.8536 5.14645C12.9473 5.24021 13 5.36739 13 5.5V12.5C13 13.3284 12.3284 14 11.5 14H3.5C2.67157 14 2 13.3284 2 12.5V2.5Z"
                  fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
            </svg>
            About
          </div>
          <div
              className="relative flex cursor-default select-none items-center
              rounded-sm py-1.5 text-sm outline-none data-[disabled=true]:pointer-events-none
              data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground
              data-[disabled=true]:opacity-50"
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"
                 className="mr-2 h-4 w-4">
              <path
                  d="M3.5 2C3.22386 2 3 2.22386 3 2.5V12.5C3 12.7761 3.22386 13 3.5 13H11.5C11.7761 13 12 12.7761 12 12.5V6H8.5C8.22386 6 8 5.77614 8 5.5V2H3.5ZM9 2.70711L11.2929 5H9V2.70711ZM2 2.5C2 1.67157 2.67157 1 3.5 1H8.5C8.63261 1 8.75979 1.05268 8.85355 1.14645L12.8536 5.14645C12.9473 5.24021 13 5.36739 13 5.5V12.5C13 13.3284 12.3284 14 11.5 14H3.5C2.67157 14 2 13.3284 2 12.5V2.5Z"
                  fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
            </svg>
            Services
          </div>
        </DialogContent>
      </Dialog>
  );
}
