import { cn } from "@/lib/utils";
import { Icons } from "@/components/icons";
import { ExitIcon } from "@radix-ui/react-icons";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import * as React from "react";
import { ModeToggle } from "@/components/mode-toggle";
import { Searchbar } from "@/components/searchbar"
import {Button} from "@/components/ui/button";
import {useRouter} from "next/navigation";
import Cookies from "js-cookie";

const components: { title: string; href: string; description: string}[] = [
  {
    title: "Profile",
    href: "",
    description: "Adjust your preferences."
  },
  {
    title: "Notifications",
    href: "",
    description: "Keep updated with the latest changes."
  },
  {
    title: "Subscription Service",
    href: "",
    description: "You can upgrade to the paid plan."
  }
];

export function Navbar({onSearchButtonClick}) {

  const router = useRouter();

  const handleHomePageClick = async() => {
    router.replace("/learnsmart-homepage");
  };

  const handleLogout = () => {
    Cookies.remove("authToken");
    router.replace("/sign-in");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <NavigationMenu>
        <NavigationMenuList>
          <Button type="button" onClick={handleHomePageClick} variant="ghost" className="hover:bg-transparent focus-visible:ring-0 space-x-1">
            <NavigationMenuItem>
              <Icons.logo className="h-6 w-6" />
            </NavigationMenuItem>
            <NavigationMenuItem>
              <p className="font-bold">learnsmart</p>
            </NavigationMenuItem>
          </Button>
          <NavigationMenuItem>
            <NavigationMenuTrigger className="focus:bg-transparent group-hover:bg-transparent bg-transparent hover:text-foreground/80
            text-foreground/60 font-light">About</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid gap-3 p-6 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                <li className="row-span-3">
                  <NavigationMenuLink asChild>
                    <a
                      className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md"
                      href="/"
                    >
                      <Icons.logo className="h-6 w-6" />
                      <div className="mb-2 mt-4 text-lg font-normal">
                        Learnsmart
                      </div>
                      <p className="text-sm leading-tight text-muted-foreground">
                        Designed to help students study their courses more effectively by intending to improve their grade output with its learning guide.
                      </p>
                    </a>
                  </NavigationMenuLink>
                </li>
                <ListItem href="https://github.com/gorkemsolun/Learn-Smart" title="Check out our GitHub page">
                  Check out learnsmart&#39;s development journey.
                </ListItem>
                <ListItem href="" title="Team">
                  Get to know us.
                </ListItem>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuTrigger className="focus:bg-transparent group-hover:bg-transparent hover:text-foreground/80 text-foreground/60 bg-transparent font-light">Services</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] ">
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
            <Searchbar onSearchButtonClick={onSearchButtonClick}/>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <ModeToggle />
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Button variant="ghost" size="icon" className="focus-visible:ring-0 bg-transparent" onClick={handleLogout}>
              <ExitIcon className="h-[1.1rem] w-[1.1rem]" />
            </Button>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </header>
  );
}

const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a">
>(({ className, title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className
          )}
          {...props}
        >
          <div className="text-sm font-normal leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  );
})
ListItem.displayName = "ListItem"
