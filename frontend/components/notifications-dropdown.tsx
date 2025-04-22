import { BellIcon } from "@radix-ui/react-icons";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export type Notification = {
  id: string;
  title: string;
  description: string;
  time: string;
  url?: string;
};

interface NotificationsPopoverProps {
  notifications: Notification[]
}

export function Notifications({ notifications }: NotificationsPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="bg-transparent focus-visible:ring-0">
          <BellIcon className="size-[1.2rem]" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="max-h-44 w-80 overflow-y-auto p-2" align="end">
        {notifications.length === 0 ? (
          <p className="p-2">No new notifications</p>
        ) : (
          <ul className="space-y-2">
            {notifications.map((n) => (
              <li key={n.id} className="block rounded-md p-2 hover:bg-accent/10">
                {n.url ? (
                  <Link href={n.url} className="block">
                    <div className="font-medium">{n.title}</div>
                    <div className="text-xs text-muted-foreground">{n.description}</div>
                    <div className="mt-1 text-[10px] text-muted-foreground">{n.time}</div>
                  </Link>
                ) : (
                  <div>
                    <div className="font-medium">{n.title}</div>
                    <div className="text-xs text-muted-foreground">{n.description}</div>
                    <div className="mt-1 text-[10px] text-muted-foreground">{n.time}</div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
