import * as React from "react";
import * as SeparatorPrimitive from "@radix-ui/react-separator";

import { cn } from "@/lib/utils";
const SeperatorWithContent = ({
  children,
  className,
  orientation = "horizontal",
  ...props
}: React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root> & { children?: React.ReactNode }) => {
  return (
    <div className={cn("flex w-full items-center justify-center", className)}>
      {orientation === "horizontal" && <div className="h-px grow bg-foreground/20" />}
      {children && <span className="px-2 text-sm text-foreground/40">{children}</span>}
      {orientation === "horizontal" && <div className="h-px grow bg-foreground/20" />}
    </div>
  );
};

export { SeperatorWithContent };