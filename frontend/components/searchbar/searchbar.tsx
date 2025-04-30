"use client";

export function Searchbar({
  onSearchButtonClick,
}: {
  onSearchButtonClick: () => void;
}) {
  return (
    <div className="relative">
      <button
        onClick={onSearchButtonClick}
        type="button"
        className="border-input bg-muted/50 text-muted-foreground hover:bg-accent hover:text-accent-foreground
        focus-visible:ring-ring relative inline-flex h-8 w-full
        items-center justify-start whitespace-nowrap rounded-lg border px-4 py-2 text-sm shadow-none
        transition-colors focus-visible:outline-none focus-visible:ring-1 disabled:pointer-events-none disabled:opacity-50 sm:pr-12 md:w-40
        lg:w-64"
      >
        <span className="hidden lg:inline-flex">Search in Edux...</span>
        <kbd className="bg-muted pointer-events-none absolute right-[0.3rem] top-[0.3rem] hidden h-5 select-none items-center gap-1 rounded border px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>
    </div>
  );
}
