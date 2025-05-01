import { Icons } from "@/components/icons";
import { ModeToggle } from "@/components/mode-toggle";
import { Searchbar } from "@/components/searchbar/searchbar";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { userService } from "@/environment/backend_api";
import { cn } from "@/lib/utils";
import { ExitIcon } from "@radix-ui/react-icons";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useState } from "react";
import { Notification, Notifications } from "./notifications-dropdown";

const components: { title: string; href: string; description: string }[] = [
  {
    title: "Profile",
    href: "/profile",
    description: "Adjust your preferences.",
  },
  {
    title: "Subscription Service",
    href: "",
    description: "You can upgrade to the paid plan.",
  },
];

interface NavbarHeaderParameters {
  onSearchButtonClick: () => void;
}

export function NavbarHeader({ onSearchButtonClick }: NavbarHeaderParameters) {
  const router = useRouter();
  const [token] = useState<string>(Cookies.get("authToken") as string);
  const updateUsageData = async () => {
    if (!token) return;

    const signInTime = Cookies.get("signin_time");

    if (!signInTime) {
      console.error("Sign-in time not found.");
      return;
    }

    const signInDate = new Date(signInTime);
    const timeDifferenceInSeconds = Math.floor(
      (Date.now() - signInDate.getTime()) / 1000
    );

    const data = {
      date: new Date().toISOString().split("T")[0], // 'YYYY-MM-DD'
      time_spent: timeDifferenceInSeconds,
      timestamp: new Date(signInTime).toISOString(),
    };
    await userService
      .post(`/analytics`, data, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })
      .catch((error) => {
        console.error(error.response);
      });
  };

  const handleHomePageClick = async () => {
    router.push("/edux-homepage");
  };

  const mock: Notification[] = [
    {
      id: "1",
      title: "Welcome!",
      description: "Thanks for joining.",
      time: "Just now",
    },
    {
      id: "2",
      title: "New message",
      description: "You have a new message from John",
      time: "5 minutes ago",
      url: "/messages/1",
    },
    {
      id: "3",
      title: "New follower",
      description: "Jane Doe is now following you",
      time: "1 hour ago",
      url: "/profile/jane-doe",
    },
  ];

  const handleLogout = () => {
    updateUsageData();
    Cookies.remove("authToken");
    Cookies.remove("signin_time");
    router.replace("/sign-in");
  };

  return (
    <div className="border-border/40 bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full backdrop-blur">
      <NavigationMenu>
        <NavigationMenuList>
          <Button
            type="button"
            onClick={handleHomePageClick}
            variant="ghost"
            className="space-x-1 hover:bg-transparent focus-visible:ring-0"
          >
            <NavigationMenuItem>
              <Icons.logo className="size-6" />
            </NavigationMenuItem>
            <NavigationMenuItem>
              <p className="font-bold">edux/ai</p>
            </NavigationMenuItem>
          </Button>
          <NavigationMenuItem>
            <NavigationMenuTrigger
              className="text-foreground/60 hover:text-foreground/80 bg-transparent font-light
            focus:bg-transparent group-hover:bg-transparent"
            >
              About
            </NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid gap-3 p-6 md:w-[50vh] lg:w-[70vh] lg:grid-cols-[.75fr_1fr]">
                <li className="row-span-3">
                  <NavigationMenuLink asChild>
                    <a
                      className="from-muted/50 to-muted flex size-full select-none flex-col justify-end rounded-md bg-gradient-to-b p-6 no-underline outline-none focus:shadow-md"
                      href="/"
                    >
                      <Icons.logo className="size-6" />
                      <div className="mb-2 mt-4 text-lg font-normal">
                        Edux/ai
                      </div>
                      <p className="text-muted-foreground text-sm leading-tight">
                        Designed to help students study their courses more
                        effectively by intending to improve their grade output
                        with its learning guide.
                      </p>
                    </a>
                  </NavigationMenuLink>
                </li>
                <ListItem
                  href="https://github.com/gorkemsolun/Learn-Smart"
                  title="Check out our GitHub page"
                >
                  Check out edux&#39;s development journey.
                </ListItem>
                <ListItem href="" title="Team">
                  Get to know us.
                </ListItem>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuTrigger className="text-foreground/60 hover:text-foreground/80 bg-transparent font-light focus:bg-transparent group-hover:bg-transparent">
              Services
            </NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid w-[40vh] gap-3 p-4 md:w-[50vh] md:grid-cols-2 lg:w-[70vh] ">
                {components.map((component) => (
                  <ListItem
                    key={component.title}
                    title={component.title}
                    href={component.href}
                  >
                    {component.description}
                  </ListItem>
                ))}
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
        <NavigationMenuList className="ml-auto">
          <NavigationMenuItem>
            <Searchbar onSearchButtonClick={onSearchButtonClick} />
          </NavigationMenuItem>
          <NavigationMenuItem>
            <ModeToggle />
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Notifications notifications={mock} />
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Button
              variant="ghost"
              size="icon"
              className="bg-transparent focus-visible:ring-0"
              onClick={handleLogout}
            >
              <ExitIcon className="size-[1.1rem]" />
            </Button>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  );
}

type ListItemProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  title: string;
  children: React.ReactNode;
};

const ListItem = React.forwardRef<HTMLAnchorElement, ListItemProps>(
  function ListItem({ className, title, children, ...props }, ref) {
    return (
      <li>
        <NavigationMenuLink asChild>
          <a
            ref={ref}
            className={cn(
              "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors",
              "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
              className
            )}
            {...props}
          >
            <div className="text-sm font-normal leading-none">{title}</div>
            <p className="text-muted-foreground line-clamp-2 text-sm leading-snug">
              {children}
            </p>
          </a>
        </NavigationMenuLink>
      </li>
    );
  }
);

ListItem.displayName = "ListItem";
