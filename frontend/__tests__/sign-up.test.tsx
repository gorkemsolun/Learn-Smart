import SignUp from "@/app/sign-up/page";
import { backendAPI } from "@/environment/backend_api";
import { useToast } from "@/hooks/use-toast";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useRouter } from "next/navigation";
import React from "react";

jest.mock("@/environment/backend_api");
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));
jest.mock("@/hooks/use-toast", () => ({
  useToast: jest.fn(),
}));

// Below suppresses console.error output from being displayed in the test output
// This is useful for hiding expected error messages from the console output
// (e.g. the error message from the toast component) when running tests of failure cases
beforeAll(() => {
  jest.spyOn(console, "error").mockImplementation(() => {});
});
afterAll(() => {
  (console.error as jest.Mock).mockRestore();
});

describe("SignUp Component", () => {
  let pushMock: jest.Mock;
  let toastMock: jest.Mock;

  beforeEach(() => {
    // Set up the router push mock
    pushMock = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push: pushMock });

    // Set up the toast mock
    toastMock = jest.fn();
    (useToast as jest.Mock).mockReturnValue({ toast: toastMock });

    // Clear any previous API call mocks
    (backendAPI.post as jest.Mock).mockClear();
    toastMock.mockClear();
  });

  test("shows error toast if any field is empty", () => {
    render(<SignUp />);
    const signUpButton = screen.getByRole("button", { name: /Sign up/i });
    fireEvent.click(signUpButton);

    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Please fill out all fields",
      })
    );
  });

  test("shows error toast for invalid email format", () => {
    render(<SignUp />);
    const emailInput = screen.getByPlaceholderText(/email@example.com/i);
    const usernameInput = screen.getByPlaceholderText(/username/i);
    // There are two password inputs so use getAllByPlaceholderText
    const passwordInputs = screen.getAllByPlaceholderText("********");

    fireEvent.change(usernameInput, { target: { value: "testuser" } });
    fireEvent.change(emailInput, { target: { value: "invalidEmail" } });
    fireEvent.change(passwordInputs[0], { target: { value: "password123" } });
    fireEvent.change(passwordInputs[1], { target: { value: "password123" } });

    const signUpButton = screen.getByRole("button", { name: /Sign up/i });
    fireEvent.click(signUpButton);

    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Invalid email format",
      })
    );
  });

  test("shows error toast if passwords do not match", () => {
    render(<SignUp />);
    const emailInput = screen.getByPlaceholderText(/email@example.com/i);
    const usernameInput = screen.getByPlaceholderText(/username/i);
    const passwordInputs = screen.getAllByPlaceholderText("********");

    fireEvent.change(usernameInput, { target: { value: "testuser" } });
    fireEvent.change(emailInput, { target: { value: "user@example.com" } });
    fireEvent.change(passwordInputs[0], { target: { value: "password123" } });
    fireEvent.change(passwordInputs[1], {
      target: { value: "differentPassword" },
    });

    const signUpButton = screen.getByRole("button", { name: /Sign up/i });
    fireEvent.click(signUpButton);

    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Passwords do not match",
      })
    );
  });

  test("handles successful sign up", async () => {
    // Mock the API call to resolve with a successful status
    (backendAPI.post as jest.Mock).mockResolvedValue({ status: 200 });

    render(<SignUp />);
    const emailInput = screen.getByPlaceholderText(/email@example.com/i);
    const usernameInput = screen.getByPlaceholderText(/username/i);
    const passwordInputs = screen.getAllByPlaceholderText("********");

    fireEvent.change(usernameInput, { target: { value: "testuser" } });
    fireEvent.change(emailInput, { target: { value: "user@example.com" } });
    fireEvent.change(passwordInputs[0], { target: { value: "password123" } });
    fireEvent.change(passwordInputs[1], { target: { value: "password123" } });

    const signUpButton = screen.getByRole("button", { name: /Sign up/i });
    fireEvent.click(signUpButton);

    await waitFor(() => expect(backendAPI.post).toHaveBeenCalled());

    // Verify the API call parameters
    expect(backendAPI.post).toHaveBeenCalledWith(
      "/users/create",
      {
        nickname: "testuser",
        email: "user@example.com",
        password: "password123",
      },
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    );
    // Check the success toast and router navigation
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Account created successfully",
      })
    );
    expect(pushMock).toHaveBeenCalledWith("/sign-in");
  });

  test("handles sign up failure", async () => {
    // Mock the API call to reject (simulate failure)
    (backendAPI.post as jest.Mock).mockRejectedValue(
      new Error("User already exists")
    );

    render(<SignUp />);
    const emailInput = screen.getByPlaceholderText(/email@example.com/i);
    const usernameInput = screen.getByPlaceholderText(/username/i);
    const passwordInputs = screen.getAllByPlaceholderText("********");

    fireEvent.change(usernameInput, { target: { value: "testuser" } });
    fireEvent.change(emailInput, { target: { value: "user@example.com" } });
    fireEvent.change(passwordInputs[0], { target: { value: "password123" } });
    fireEvent.change(passwordInputs[1], { target: { value: "password123" } });

    const signUpButton = screen.getByRole("button", { name: /Sign up/i });
    fireEvent.click(signUpButton);

    await waitFor(() => expect(backendAPI.post).toHaveBeenCalled());

    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Account creation failed",
      })
    );
  });

  test('navigates to sign-in page when "Sign in" button is clicked', () => {
    render(<SignUp />);
    // Find the "Sign in" button (the one that triggers navigation, not the toast)
    const signInButton = screen.getByRole("button", { name: /Sign in/i });
    fireEvent.click(signInButton);
    expect(pushMock).toHaveBeenCalledWith("/sign-in");
  });
});
