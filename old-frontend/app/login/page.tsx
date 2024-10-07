"use client";

import ForgotPasswordModal from "@/app/components/modals/forgot-password-modal";
import { backendAPI } from "@/environment/backend_api";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FaRegEnvelope } from "react-icons/fa";
import { MdLockOutline } from "react-icons/md";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function LoginPage() {
  const [email, setEmail] = useState<string>(Cookies.get("emailCookie") || "");
  const [password, setPassword] = useState<string>("");
  const [rememberMe, setRememberMe] = useState<boolean>(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] =
    useState<boolean>(false); // State for modal visibility
  const router = useRouter();

  useEffect(() => {
    // Check if there exists an email cookie
    const emailCookie = Cookies.get("emailCookie");
    if (emailCookie) {
      setEmail(emailCookie);
      setRememberMe(true);
    }

    // Redirect to homepage if already logged in
    const authToken = Cookies.get("authToken");
    if (authToken) {
      router.push("/home-page");
    }
  }, [router]);

  const handleForgotPasswordClick = () => {
    // Open the modal
    setShowForgotPasswordModal(true);
  };

  const closeModal = () => {
    // Close the modal
    setShowForgotPasswordModal(false);
  };

  const handleLogin = async () => {
    await backendAPI
      .post(
        "/users/login",
        {
          username: email,
          password: password,
        },
        {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      )
      .then((response) => {
        if (response.status === 200) {
          toast.success("Login successful");

          const data = response.data;

          // Store the token in a cookie
          Cookies.set("authToken", data["access_token"], { expires: 3 });

          // Remember email if "Remember Me" checkbox is checked
          if (rememberMe) {
            Cookies.set("emailCookie", email, { expires: 3 });
          } else {
            Cookies.remove("emailCookie");
          }
          setTimeout(() => {
            router.push("/home-page");
          }, 1500);
        }
      })
      .catch((error) => {
        console.error("Login error:", error);
        toast.error("Login failed");
      });
  };

  const handleCreateAccount = () => {
    router.push("/create-account");
  };

  return (
    <main className="flex flex-col items-center justify-center w-full flex-1 px-20 text-center bg-gray-100 min-h-screen">
      <ToastContainer
        position="top-center"
        autoClose={1500}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss={false}
        draggable={false}
        pauseOnHover={false}
        theme="light"
      />
      {showForgotPasswordModal && (
        <ForgotPasswordModal closeModal={closeModal} />
      )}

      <div className="bg-white text-black rounded-2xl shadow-2xl flex w-2/3 max-w-4xl">
        <div className="w-3/5 p-5">
          <div className="text-left font-bold mb-12">
            <span className="text-blue-500">Learn</span>Smart
          </div>
          <div className="py-5">
            <h2 className="text-3xl font-bold text-black-500 mb-2">
              Login to LearnSmart
            </h2>
          </div>
          <div className="border-2 w-10 border-black inline-block mb-2"></div>
          <div className="flex flex-col items-center">
            <div className="bg-gray-100 w-64 p-2 flex items-center mb-3">
              <FaRegEnvelope />
              <input
                type="text"
                value={email}
                placeholder="Email"
                onChange={(e) => setEmail(e.target.value)}
                className="ml-1 bg-gray-100 outline-none text-sm flex-1"
              />
            </div>
            <div className="bg-gray-100 w-64 p-2 flex items-center mb-3">
              <MdLockOutline />
              <input
                type="password"
                value={password}
                placeholder="Password"
                onChange={(e) => setPassword(e.target.value)}
                className="ml-1 bg-gray-100 outline-none text-sm flex-1"
              />
            </div>
          </div>
          <div className="flex justify-between w-64 mb-4 mx-auto">
            <label className="flex items-center text-xs">
              <input
                type="checkbox"
                name="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="mr-1"
              />
              Remember Me
            </label>
            <button
              className="text-xs"
              onClick={handleForgotPasswordClick}
              type="button"
            >
              Forgot Password?
            </button>
          </div>
          <button
            onClick={handleLogin}
            className="border-2 bg-white border-black text-black
              rounded-full px-12 py-2 inline-block font-semibold hover:bg-black hover:text-white"
            type="button"
          >
            Login
          </button>
        </div>
        <div className="w-2/5 bg-black text-white rounded-tr-2xl rounded-br-2xl flex flex-col items-center justify-center py-28 px-12">
          <h2 className="text-3xl font-bold mb-10">Create Account</h2>
          <div className="border-2 w-10 border-white inline-block mb-32"></div>
          <div className="mb-1.5"></div>
          <button
            onClick={handleCreateAccount}
            className="border-2 text-white border-white bg-black rounded-full px-12 py-2 inline-block font-semibold hover:bg-white hover:text-black"
            type="button"
          >
            Create Account
          </button>
        </div>
      </div>
    </main>
  );
}
