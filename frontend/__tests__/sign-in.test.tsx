import SignIn from "@/app/sign-in/page";
import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import React from "react";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("js-cookie", () => ({
  get: jest.fn(),
  set: jest.fn(),
}));

jest.mock("@/environment/backend_api", () => ({
  backendAPI: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

describe("SignIn component", () => {
  const push = jest.fn();

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({ push });
    (Cookies.get as jest.Mock).mockImplementation((key: string) => {
      if (key === "emailCookie") return "test@example.com";
      return "";
    });
    jest.clearAllMocks();
  });

  it("navigates to sign-up page on Sign up button click", () => {
    render(<SignIn />);
    const signUpButton = screen.getByText(/Sign up/i);
    fireEvent.click(signUpButton);
    expect(push).toHaveBeenCalledWith("/sign-up");
  });
});
