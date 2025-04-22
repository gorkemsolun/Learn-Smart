import SignIn from "@/app/sign-in/page";
import { backendAPI } from "@/environment/backend_api";
import "@testing-library/jest-dom";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
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

jest.mock("@/hooks/use-toast", () => ({
  useToast: jest.fn(() => ({
    toast: jest.fn(),
  })),
}));

jest.mock("@/environment/backend_api", () => ({
  backendAPI: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

describe("SignIn Page", () => {
  const mockRouterPush = jest.fn();

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({ push: mockRouterPush });
    // Default: for tests that don't require auth, return no auth token.
    (Cookies.get as jest.Mock).mockImplementation((key) => {
      if (key === "emailCookie") return "test@example.com";
      if (key === "authToken") return null;
      return null;
    });
    (Cookies.set as jest.Mock).mockImplementation(() => {});
    // Default backendAPI.get always returns a resolved promise with role "User"
    (backendAPI.get as jest.Mock).mockImplementation(() =>
      Promise.resolve({ data: { role: "User" } })
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("renders SignIn component", async () => {
    await act(async () => {
      render(<SignIn />);
    });
    expect(screen.getByText("Sign in an account")).toBeInTheDocument();
  });

  test("handles email input change", async () => {
    // Override Cookies.get for "emailCookie" to return an empty string
    (Cookies.get as jest.Mock).mockImplementation((key) => {
      if (key === "emailCookie") return "";
      if (key === "authToken") return null;
      return null;
    });

    await act(async () => {
      render(<SignIn />);
    });
    const emailInput = screen.getByPlaceholderText("email@example.com");

    await act(async () => {
      fireEvent.change(emailInput, { target: { value: "new@example.com" } });
    });
    expect(emailInput).toHaveValue("new@example.com");
  });

  test("handles password input change", async () => {
    // For password test, auth token is not needed.
    (Cookies.get as jest.Mock).mockImplementation((key) => {
      if (key === "emailCookie") return "";
      if (key === "authToken") return null;
      return null;
    });

    await act(async () => {
      render(<SignIn />);
    });
    const passwordInput = screen.getByPlaceholderText("********");
    await act(async () => {
      fireEvent.change(passwordInput, { target: { value: "newpassword" } });
    });
    expect(passwordInput).toHaveValue("newpassword");
  });

  test("handles sign in button click", async () => {
    // For sign-in tests, we need an auth token.
    (Cookies.get as jest.Mock).mockImplementation((key) => {
      if (key === "emailCookie") return "test@example.com";
      if (key === "authToken") return "testToken";
      return null;
    });
    jest.spyOn(backendAPI, "post").mockResolvedValue({
      data: {
        access_token: "newToken",
      },
    });

    await act(async () => {
      render(<SignIn />);
    });
    const signInButton = screen.getByText("Sign in");

    await act(async () => {
      fireEvent.click(signInButton);
    });

    expect(backendAPI.post).toHaveBeenCalledWith(
      "/users/login",
      { username: "test@example.com", password: "" },
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
  });

  test("redirects to appropriate page based on role", async () => {
    // For redirection test, ensure auth token is set.
    (Cookies.get as jest.Mock).mockImplementation((key) => {
      if (key === "emailCookie") return "test@example.com";
      if (key === "authToken") return "testToken";
      return null;
    });
    jest.spyOn(backendAPI, "post").mockResolvedValue({
      data: {
        access_token: "newToken",
      },
    });
    // Ensure backendAPI.get resolves properly when fetching the user role
    (backendAPI.get as jest.Mock).mockImplementation(() =>
      Promise.resolve({ data: { role: "User" } })
    );

    await act(async () => {
      render(<SignIn />);
    });
    const signInButton = screen.getByText("Sign in");

    await act(async () => {
      fireEvent.click(signInButton);
    });

    // Wait for asynchronous updates that trigger router push
    await waitFor(() => {
      expect(backendAPI.get).toHaveBeenCalledWith("/users/me", {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer testToken",
        },
      });
      expect(mockRouterPush).toHaveBeenCalledWith("/edux-homepage");
    });
  });
});
