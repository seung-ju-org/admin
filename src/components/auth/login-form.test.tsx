import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  signIn: vi.fn(),
  push: vi.fn(),
  refresh: vi.fn(),
  callbackUrl: "/admin/projects",
}));

vi.mock("next-auth/react", () => ({
  signIn: mocks.signIn,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }),
  useSearchParams: () =>
    new URLSearchParams(`callbackUrl=${encodeURIComponent(mocks.callbackUrl)}`),
}));

import { LoginForm } from "@/components/auth/login-form";

const messages = {
  title: "Sign in",
  description: "Use your account",
  usernameLabel: "Username",
  usernamePlaceholder: "Enter your username",
  passwordLabel: "Password",
  passwordPlaceholder: "Enter your password",
  signIn: "Sign in",
  signingIn: "Signing in...",
  invalidCredentials: "Invalid credentials",
  quote: "Quote",
};

describe("LoginForm", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.callbackUrl = "/admin/projects";
  });

  it("submits credentials and navigates to callback url on success", async () => {
    const user = userEvent.setup();
    mocks.signIn.mockResolvedValueOnce({ ok: true });

    render(<LoginForm locale="en" messages={messages} />);

    await user.type(screen.getByLabelText("Username"), "admin");
    await user.type(screen.getByLabelText("Password"), "admin");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => {
      expect(mocks.signIn).toHaveBeenCalledWith("credentials", {
        username: "admin",
        password: "admin",
        redirect: false,
        callbackUrl: "/admin/projects",
      });
    });

    expect(mocks.push).toHaveBeenCalledWith("/admin/projects");
    expect(mocks.refresh).toHaveBeenCalledTimes(1);
  });

  it("shows error message when sign-in fails", async () => {
    const user = userEvent.setup();
    mocks.signIn.mockResolvedValueOnce({ error: "Invalid credentials" });

    render(<LoginForm locale="en" messages={messages} />);

    await user.type(screen.getByLabelText("Username"), "admin");
    await user.type(screen.getByLabelText("Password"), "wrong");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText("Invalid credentials")).toBeInTheDocument();
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it("falls back to /admin when callbackUrl is unsafe", async () => {
    const user = userEvent.setup();
    mocks.callbackUrl = "http://malicious.example.com";
    mocks.signIn.mockResolvedValueOnce({ ok: true });

    render(<LoginForm locale="en" messages={messages} />);

    await user.type(screen.getByLabelText("Username"), "admin");
    await user.type(screen.getByLabelText("Password"), "admin");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => {
      expect(mocks.signIn).toHaveBeenCalledWith(
        "credentials",
        expect.objectContaining({ callbackUrl: "/admin" }),
      );
    });
  });
});
