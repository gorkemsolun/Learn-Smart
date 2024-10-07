import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  NavbarNotificationsFlyoutMenuParameters,
  Notification,
} from "../../types";

export default function NavbarNotificationsFlyoutMenu({
  isOpen,
}: NavbarNotificationsFlyoutMenuParameters) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const handleSeeMoreClick = () => {
    router.replace("/notifications");
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className={`relative transition-opacity duration-300 ${
        isOpen ? "opacity-100 z-20" : "opacity-0"
      }`}
    >
      <div className="absolute right-0 mt-6 w-screen max-w-md">
        <div className="bg-gray-50 px-4 mt py-4 sm:px-6 sm:py-6 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 border-b border-black">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-medium text-gray-900">Notifications</h2>
            <button
              type="button"
              onClick={handleSeeMoreClick}
              className="text-sm text-gray-500 hover:text-gray-700 focus:outline-none"
            >
              See More
            </button>
          </div>
          <div className="h-32 overflow-y-auto">
            <ul className="space-y-2 max-h-32">
              {notifications.length ? (
                notifications.map(
                  (notification: Notification, index: Number) => (
                    <li
                      key={notification.toString()}
                      className="flex items-start cursor-pointer bg-gray-200 p-2 rounded-md"
                    >
                      <img
                        src="https://images.unsplash.com/photo-1496128858413-b36217c2ce36?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=3603&q=80"
                        alt=""
                        className="h-10 w-10 rounded-md object-cover"
                      />
                      <div className="ml-2">
                        <p className="text-sm text-gray-500">
                          <time dateTime="2023-03-16">
                            {notification.notification_date}
                          </time>
                        </p>
                        <a
                          href="#"
                          className="text-base font-medium text-gray-900 hover:text-gray-700"
                        >
                          {notification.notification_title}
                        </a>
                        <p className="mt-1 text-sm text-gray-500">
                          {notification.notification_content}
                        </p>
                      </div>
                    </li>
                  )
                )
              ) : (
                <li className="flex items-start cursor-pointer bg-gray-200 p-2 rounded-md">
                  <div className="ml-2">
                    <p className="flex justify-center text-sm text-gray-500">
                      No notifications
                    </p>
                  </div>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
