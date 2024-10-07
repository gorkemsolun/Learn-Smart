"use client";

import { backendAPI } from "@/environment/backend_api";
import Cookies from "js-cookie";
import { useEffect, useState } from "react";
import { IoIosNotifications, IoIosNotificationsOutline } from "react-icons/io";
import { printDebugMessage } from "../debugger";
import { Notification, User } from "../types";

export default function Notifications() {
  const [token, setToken] = useState<string>(
    Cookies.get("authToken") as string
  );
  const [user, setUser] = useState<User>({
    user_id: "",
    name: "",
    nickname: "",
    email: "",
    password: "",
    created_at: "",
    courses: [],
  });

  const [notifications, setNotifications] = useState<Notification[]>([
    {
      notification_id: "",
      notification_title: "",
      notification_content: "",
      notification_date: "",
      notification_is_new: false,
      notification_receiver_id: "",
      notification_sender_id: "",
    },
  ]);

  useEffect(() => {
    printDebugMessage("Token: " + token);
    fetchCurrentUser();
  }, [token]);

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  async function fetchNotifications() {
    if (
      user.user_id === "" ||
      user.user_id === undefined ||
      user.user_id === null
    ) {
      return;
    }

    await backendAPI
      .get("/notification/all/" + user.user_id, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => {
        setNotifications(response.data);

        printDebugMessage("Notifications fetched successfully");
        printDebugMessage(response);
      });
  }

  async function fetchCurrentUser() {
    await backendAPI
      .get("/users/me", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => {
        printDebugMessage("User data fetched successfully");
        printDebugMessage(response);

        setUser(response.data);
      });
  }

  function newNotificationCount() {
    return notifications.filter(
      (notification) => notification.notification_is_new
    ).length;
  }

  function markAllAsRead() {
    setNotifications(
      notifications.map((notification) => {
        return { ...notification, notification_is_new: false };
      })
    );
  }

  function addNewNotification(notification_id: string) {
    setNotifications(
      notifications.map((notification) => {
        if (notification.notification_id === notification_id) {
          return { ...notification, notification_is_new: true };
        }
        return notification;
      })
    );
  }

  function removeNewNotification(notification_id: string) {
    setNotifications(
      notifications.map((notification) => {
        if (notification.notification_id === notification_id) {
          return { ...notification, notification_is_new: false };
        }
        return notification;
      })
    );
  }

  return (
    <div className="flex flex-col justify-center w-full bg-white rounded-lg absolute shadow-sm">
      <div className="flex flex-row gap-x-6 m-6 justify-center items-center">
        <h1 className="text-4xl font-bold">Notifications</h1>
        <a className="text-3xl bg-black font-bold text-white rounded-lg px-3 my-auto">
          {newNotificationCount()}
        </a>
        <a
          onClick={markAllAsRead}
          className="text-[#868690] m-auto mr-0 cursor-pointer duration-200 hover:text-[#43608c]"
        >
          Mark all as read
        </a>
      </div>

      <ul className="flex flex-col gap-x-3 gap-y-2 m-8">
        {notifications.map((notification: Notification) => (
          <li className="flex items-start cursor-pointer bg-gray-200 p-2 rounded-md">
            <img
              src="https://images.unsplash.com/photo-1496128858413-b36217c2ce36?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=3603&q=80"
              alt=""
              className="h-32 w-32 rounded-md object-cover m-4"
            />
            <div className="m-4">
              <p className="text-xl text-gray-500">
                <time dateTime="2023-03-16">
                  {notification.notification_date}
                </time>
              </p>
              <a
                href="#"
                className="text-2xl font-medium text-gray-900 hover:text-gray-700"
              >
                {notification.notification_title}
              </a>
              <p className="mt-1 text-xl text-gray-500">
                {notification.notification_content}
              </p>
            </div>
            {notification.notification_is_new ? (
              <IoIosNotifications
                size={30}
                onClick={() =>
                  removeNewNotification(notification.notification_id)
                }
              />
            ) : (
              <IoIosNotificationsOutline
                size={30}
                onClick={() => addNewNotification(notification.notification_id)}
              />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
