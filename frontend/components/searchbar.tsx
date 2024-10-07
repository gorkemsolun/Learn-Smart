"use client"

import React, { useEffect } from "react";

export function Searchbar({ onSearchButtonClick }) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      // For Mac (⌘K) or Windows/Linux (Ctrl+K)
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        onSearchButtonClick();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onSearchButtonClick]);

  return (
    <div className="relative">
      <button
        onClick={onSearchButtonClick}
        className="inline-flex items-center whitespace-nowrap transition-colors focus-visible:outline-none
        focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border
        border-input hover:bg-accent hover:text-accent-foreground px-4 py-2 relative h-8 w-full justify-start
        rounded-[0.5rem] bg-muted/50 text-sm text-muted-foreground shadow-none sm:pr-12 md:w-40
        lg:w-64 font-sans font-light"
      >
        <span className="hidden lg:inline-flex">Search in learnsmart...</span>
        <kbd className="pointer-events-none absolute right-[0.3rem] top-[0.3rem] hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>
    </div>
  );
}
