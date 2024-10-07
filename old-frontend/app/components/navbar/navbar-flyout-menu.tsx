import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { FaCog, FaUser } from "react-icons/fa";
import { NavbarFlyoutMenuParameters } from "../../types";

export default function NavbarFlyoutMenu({
  isOpen,
}: NavbarFlyoutMenuParameters) {
  if (!isOpen) {
    return null;
  }

  const router = useRouter();

  const handleLogout = () => {
    Cookies.remove("authToken");
    router.replace("/login");
  };

  const navigateToProfile = () => {
    router.push("/profile"); // Corrected to include leading slash
  };

  const navigateToSettings = () => {
    router.push("/settings"); // Corrected to include leading slash
  };

  return (
    <div className="relative z-20">
      <div
        className="absolute right-0 max-w-md"
        style={{ marginTop: 1.35 + "rem" }}
      >
        <div className="rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 overflow-hidden">
          <div className="bg-white px-4 py-2 sm:p-4">
            <div className="flex flex-col gap-2">
              <a
                href="#"
                onClick={navigateToProfile}
                className="flex items-center text-base font-medium text-gray-800 hover:text-gray-900 py-2 px-4 rounded-lg transition duration-150 ease-in-out"
              >
                <FaUser className="w-5 h-5 mr-2 text-gray-600 hover:text-gray-900" />
                Profile
              </a>
              <a
                href="#"
                onClick={navigateToSettings}
                className="flex items-center text-base font-medium text-gray-800 hover:text-gray-900 py-2 px-4 rounded-lg transition duration-150 ease-in-out"
              >
                <FaCog className="w-5 h-5 mr-2 text-gray-600 hover:text-gray-900" />
                Settings
              </a>
              <div className="border-t border-gray-200 my-2"></div>
              <a
                href="#"
                onClick={handleLogout}
                className="flex items-center text-base font-medium text-red-600 hover:text-red-900 py-2 px-4 rounded-lg transition duration-150 ease-in-out"
              >
                Logout
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
