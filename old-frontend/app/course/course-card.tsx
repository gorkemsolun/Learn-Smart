import "@/app/style/course-card.css";
import type { CourseCardParameters } from "@/app/types";
import dep_logo from "@/assets/dep_logo.png";
import { backend } from "@/environment/backend_api";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { MdOutlineKeyboardArrowDown } from "react-icons/md";
import { Course } from "../types";
import CourseCardFlyoutMenu from "./course-card-flyout-menu";

export default function CourseCard(parameters: CourseCardParameters) {
  const [hovered, setHovered] = useState<boolean>(false);
  const [currentMenu, setCurrentMenu] = useState<string>("");
  const router = useRouter();
  const courseCardRef = useRef<HTMLDivElement>(null);
  const image = `${backend.getUri()}/${parameters.course.course_icon_url}`;

  const handleHover = () => {
    setHovered(true);
  };

  const handleLeave = () => {
    setHovered(false);
  };

  const handleClick = () => {
    router.push(`/course/${parameters.course.course_id}`);
  };

  function handleClickOutside(event: any) {
    if (
      courseCardRef.current &&
      !courseCardRef.current.contains(event.target)
    ) {
      setCurrentMenu("");
    }
  }

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  function renderMenu(course: Course): JSX.Element {
      return (
        <div className="relative">
          <button
            type="button"
            className="inline-flex items-center text-xl font-semibold ml-1 mt-1"
            onClick={() => setCurrentMenu((prevMenu) => (prevMenu === "menu" ? "" : "menu"))}
          >
            <MdOutlineKeyboardArrowDown/>
          </button>
          {currentMenu === "menu" && (
            <CourseCardFlyoutMenu
              isOpen={currentMenu === "menu"}
              onClose={() => setCurrentMenu("")}
              course={course}
            />
          )}
        </div>
      );
  }

  return (
    <main ref={courseCardRef}>
      <button
        className="course-card flex flex-col items-center p-4 bg-red-500 shadow-lg relative overflow-hidden"
        onMouseEnter={handleHover}
        onMouseLeave={handleLeave}
        onClick={handleClick}
        type="button"
      >
        <div className="image-container bg-transparent">
          {parameters.course.course_icon_url ? (
            <img
              src={image}
              alt={parameters.course.course_name}
              className="course-image"
            />
          ) : (
            <Image
              src={dep_logo}
              alt={parameters.course.course_name}
              className="course-image"
            />
          )}
        </div>
        <div className="mt-2 text-white font-semibold">
          {parameters.course.course_name}
        </div>

        <div className={`overlay-content ${hovered ? "active" : ""}`}>
          <div className="overlay-text">{parameters.course.course_code}</div>
        </div>
      </button>

      <div className="mt-2 flex items-center justify-center text-black font-semibold">
          <span>{parameters.course.course_code}</span>
          {renderMenu(parameters.course)}
      </div>
    </main>
  );
}
