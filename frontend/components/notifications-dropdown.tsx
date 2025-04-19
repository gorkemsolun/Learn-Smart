import { Bell } from "lucide-react";
import Link from "next/link";

export type Notification = {
  id: string;
  title: string;
  description: string;
  time: string;
  url?: string;
};

interface NotificationsDropdownProps {
  notifications: Notification[];
}

export function NotificationsDropdown({
  notifications,
}: NotificationsDropdownProps) {
  return (
    <div className="group relative">
      <Bell className="size-5 cursor-pointer text-white hover:text-white/80" />

      <div className="border-border bg-background text-foreground absolute right-0 top-full z-50 mt-2 hidden max-h-80 w-64 overflow-y-auto rounded-md border p-2 text-sm shadow-lg group-hover:block">
        {notifications.length === 0 ? (
          <p className="p-2">No new notifications</p>
        ) : (
          <ul className="space-y-2">
            {notifications.map((n) => (
              <li
                key={n.id}
                className="hover:bg-accent/10 block rounded-md p-2"
              >
                {n.url ? (
                  <Link href={n.url} className="block">
                    <div className="font-medium">{n.title}</div>
                    <div className="text-muted-foreground text-xs">
                      {n.description}
                    </div>
                    <div className="text-muted-foreground mt-1 text-[10px]">
                      {n.time}
                    </div>
                  </Link>
                ) : (
                  <div>
                    <div className="font-medium">{n.title}</div>
                    <div className="text-muted-foreground text-xs">
                      {n.description}
                    </div>
                    <div className="text-muted-foreground mt-1 text-[10px]">
                      {n.time}
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
