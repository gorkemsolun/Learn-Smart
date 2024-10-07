import "@/app/style/logo-font.css";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { FaBars, FaTimes } from "react-icons/fa";
import { HiMiniBell } from "react-icons/hi2";
import { NavbarElement } from "../../types";
import NavbarFlyoutMenu from "./navbar-flyout-menu";
import Notifications from "./navbar-notifications-flyout-menu";

export default function Navbar() {
  const [nav, setNav] = useState<boolean>(false);
  const [currentMenu, setCurrentMenu] = useState<string>("");
  const router = useRouter();
  const navRef = useRef<HTMLDivElement>(null);

  const navbarElements: NavbarElement[] = [
    {
      navbar_element_id: 1,
      navbar_element_name: "notifications",
      navbar_element_link: "notifications",
      navbar_element_component: renderNotifications,
    },
    {
      navbar_element_id: 2,
      navbar_element_name: "menu",
      navbar_element_link: "menu",
      navbar_element_component: renderMenu,
    },
  ];

  function handleMenuClick(menu: any) {
    setCurrentMenu(currentMenu === menu ? null : menu);
  }

  const handleHomePageClick = () => {
    router.replace("/home-page");
  };

  function handleClickOutside(event: any) {
    if (navRef.current && !navRef.current.contains(event.target)) {
      setCurrentMenu("");
      setNav(false);
    }
  }

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  function renderNotifications(): JSX.Element {
    return (
      <div>
        <button
          type="button"
          className="text-lm font-medium text-black flex items-center space-x-1"
          title="Notifications"
        >
          <HiMiniBell className="h-5 w-5" />
        </button>
        <Notifications
          isOpen={currentMenu === "notifications"}
          onClose={() => setCurrentMenu("")}
        />
      </div>
    );
  }

  function renderMenu(): JSX.Element {
    return (
      <div>
        <button
          type="button"
          className="inline-flex items-center gap-x-1 text-sm font-semibold leading-6 text-gray-900"
        >
          <u>Menu</u>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
            className={`h-5 w-5 transform transition-transform duration-300 ${
              currentMenu === "menu" ? "rotate-180" : "rotate-0"
            }`}
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0
                      111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </button>
        <NavbarFlyoutMenu
          isOpen={currentMenu === "menu"}
          onClose={() => setCurrentMenu("")}
        />
      </div>
    );
  }

  return (
    <div
      className="flex justify-between items-center w-full h-16 px-4 text-black bg-white nav"
      ref={navRef}
    >
      <button type="button" onClick={() => handleHomePageClick()}>
        <div>
          <div className="inline-flex gap-0">
            <h1
              className="text-4xl font-bold"
              style={{
                fontFamily: "logo-font, serif",
                color: "rgb(23,144, 288)",
                letterSpacing: "0.025em",
              }}
            >
              learn
            </h1>
            <h1
              className="text-4xl font-bold"
              style={{
                fontFamily: "logo-font, serif",
                color: "black",
                letterSpacing: "0.025em",
              }}
            >
              smart
            </h1>
          </div>
        </div>
      </button>
      <ul className="hidden md:flex items-center">
        {navbarElements.map(
          ({
            navbar_element_id,
            navbar_element_link,
            navbar_element_component,
          }) => (
            <li
              key={navbar_element_id}
              className="nav-navbarElements px-4 cursor-pointer capitalize font-medium text-gray-500 link-underline"
              onClick={() => handleMenuClick(navbar_element_link)}
            >
              {navbar_element_component()}
            </li>
          )
        )}
      </ul>

      <div
        onClick={() => setNav(!nav)}
        className="cursor-pointer pr-4 z-10 text-gray-500 md:hidden"
      >
        {nav ? <FaTimes size={30} /> : <FaBars size={30} />}
      </div>

      {nav && (
        <ul className="flex flex-col justify-center items-center absolute top-0 left-0 w-full h-screen bg-gradient-to-b from-white to-gray-800 text-gray-500">
          {navbarElements.map(({ navbar_element_id, navbar_element_link }) => (
            <li
              key={navbar_element_id}
              className="px-4 cursor-pointer capitalize py-6 text-4xl"
              onClick={() => handleMenuClick(navbar_element_link)}
            >
              {navbar_element_link === "menu" ? (
                <div>
                  <button className="text-4xl" type="button">
                    Menu
                  </button>
                  <NavbarFlyoutMenu
                    isOpen={currentMenu === "menu"}
                    onClose={() => setCurrentMenu("")}
                  />
                </div>
              ) : navbar_element_link === "notifications" ? (
                <div>
                  <button className="text-4xl" type="button">
                    Notifications
                  </button>
                  <Notifications
                    isOpen={currentMenu === "notifications"}
                    onClose={() => setCurrentMenu("")}
                  />
                </div>
              ) : (
                <></>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
