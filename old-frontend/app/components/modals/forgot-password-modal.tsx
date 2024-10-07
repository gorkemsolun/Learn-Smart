import React, { useState } from "react";
import { FaRegEnvelope } from "react-icons/fa";
import { ForgotPasswordModalParameters } from "../../types";

export default function ForgotPasswordModal(
  forgotPasswordModalParameters: ForgotPasswordModalParameters
) {
  const [email, setEmail] = useState<string>("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await fetch("/api/password/reset", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    })
      .then((response) => {
        const data = response.json();

        // TODO: Handle response from backend
        console.log(data);
      })
      .catch((error) => {
        console.error("Error sending password reset request:", error);
      });

    forgotPasswordModalParameters.closeModal();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-gray-900 bg-opacity-75">
      <div className="bg-white p-8 md:p-12 rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Forgot Password
          </h2>
          <button
            className="text-gray-600 hover:text-gray-800 focus:outline-none"
            onClick={forgotPasswordModalParameters.closeModal}
            type="button"
            title="Close Modal"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <hr className="mb-4 border-gray-200 w-full" />
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email address
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaRegEnvelope
                  className="h-5 w-5 text-gray-400"
                  aria-hidden="true"
                />
              </div>
              <input
                type="email"
                id="email"
                className="block w-full pl-10 sm:text-sm border-gray-300 rounded-md bg-gray-100 text-gray-900 h-10"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="flex justify-between">
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium text-gray-900 bg-gray-100 border border-transparent
              rounded-md hover:bg-gray-200"
              onClick={forgotPasswordModalParameters.closeModal}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-gray-800 border
              border-transparent rounded-md shadow-sm hover:bg-gray-900"
            >
              Send Reset Link
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
