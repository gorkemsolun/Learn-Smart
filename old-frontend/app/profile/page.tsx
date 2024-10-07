"use client";

import { backendAPI } from "@/environment/backend_api";
import Cookies from "js-cookie";
import { useEffect, useState } from "react";
import EditProfileModal from "../components/modals/edit-profile-modal";
import Navbar from "../components/navbar/navbar";
import { printDebugMessage } from "../debugger";
import { User } from "../types";

export default function Profile() {
  const [token, setToken] = useState<string>(
    Cookies.get("authToken") as string
  );
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [user, setUser] = useState<User>({
    user_id: "",
    name: "",
    nickname: "",
    email: "",
    password: "",
    created_at: "",
    courses: [],
  });
  // const [courses, setCourses] = useState([]); // TODO: replace with actual courses

  useEffect(() => {
    fetchUserData();
    printDebugMessage("Token: " + token);
  }, []);

  async function fetchUserData() {
    printDebugMessage(
      "Fetching user data from backend for profile page with token: " + token
    );

    await backendAPI
      .get("/users/me", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => {
        setUser(response.data);

        printDebugMessage("User data fetched successfully");
        printDebugMessage(response);
      });
  }

  async function handleEditProfile(
    user_id: string,
    name: string,
    nickname: string,
    email: string,
    password: string
  ) {
    printDebugMessage("Editing profile for user: " + user_id);

    return new Promise<void>(async (resolve, reject) => {
      await backendAPI
        .put(
          `/users/update`,
          {
            name: name,
            nickname: nickname,
            email: email,
            password: password,
          },
          {
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        )
        .then((response) => {
          // Update the user state with the new data
          setUser(response.data as User);
        });

      resolve();
    });
  }

  return (
    <div>
      <Navbar />
      <div>
        <div
          className="w-full h-80 items-center justify-center flex  bg-gray-100 bg-gradient-to-b
                     from-gray-100 via-gray-100 to-gray-400"
        >
          <img
            src="https://www.w3schools.com/howto/img_avatar.png"
            className="rounded-full md:absolute border-4 border-white max-w-64 max-h-64"
            title="profile photo"
          />
        </div>

        <div className="flex justify-center flex-col mt-5 mb-3.5">
          <h1 className="text-center font-bold text-3xl">{user.nickname}</h1>
          <a href="#" className="text-center text-gray-600 font-semibold">
            {user.email}
          </a>
          <hr className="full flex self-center w-2/3 mt-2" />
        </div>

        <div className="w-full flex justify-center mb-2.5">
          {false ? (
            <ul className="flex px-5 py-1.5">
              <li className="px-3 font-semibold text-gray-600">
                <a href="#">Courses</a>
              </li>
            </ul>
          ) : (
            <></>
          )}
          <ul className="flex mb:pl-14">
            <li className="px-2 font-semibold">
              <button
                className="bg-gray-200 px-5 py-1 rounded-lg text-black font-semibold"
                type="button"
                onClick={() => {
                  setModalOpen(!modalOpen);
                  printDebugMessage("Edit Profile button clicked");
                }}
              >
                <i className="bx bx-edit-alt mr-2 text-xl"></i>
                Edit Profile
              </button>
            </li>
          </ul>
        </div>
      </div>

      <EditProfileModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmitted={handleEditProfile}
        user={user}
      />

      {false ? (
        <div className="flex justify-center h-screen mr-12 mt-4 p-4 shadow rounded-lg bg-white w-80">
          <div className="flex justify-between">
            <h1 className="font-bold text-xl">Courses</h1>
            <div className="text-lg text-gray-700 hover:bg-blue-200">
              See All Courses
            </div>
          </div>
          <div>
            <p className="text-base text-gray-400">10 courses</p>
            <div className="grid grid-cols-3 gap-1">
              <div className="bg-white p-0.5">
                <img
                  className="w-24 h-24 rounded-md mt-2 cursor-pointer"
                  title="Course"
                />
                <div className="font-semibold text-sm">Course FullName</div>
              </div>
              <div className="bg-white p-0.5">
                <img
                  className="w-24 h-24 rounded-md mt-2 cursor-pointer"
                  title="Course"
                />
                <div className="font-semibold text-sm">Course FullName</div>
              </div>
              <div className="bg-white p-0.5">
                <img
                  className="w-24 h-24 rounded-md mt-2 cursor-pointer"
                  title="Course"
                />
                <div className="font-semibold text-sm">Course FullName</div>
              </div>
              <div className="bg-white p-0.5">
                <img
                  className="w-24 h-24 rounded-md mt-2 cursor-pointer"
                  title="Course"
                />
                <div className="font-semibold text-sm">Course FullName</div>
              </div>
              <div className="bg-white p-0.5">
                <img
                  className="w-24 h-24 rounded-md mt-2 cursor-pointer"
                  title="Course"
                />
                <div className="font-semibold text-sm">Course FullName</div>
              </div>
              <div className="bg-white p-0.5">
                <img
                  className="w-24 h-24 rounded-md mt-2 cursor-pointer"
                  title="Course"
                />
                <div className="font-semibold text-sm">Course FullName</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <></>
      )}
    </div>
  );
}
