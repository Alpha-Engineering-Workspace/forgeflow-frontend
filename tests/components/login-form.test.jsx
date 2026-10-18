import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "../../src/features/auth/components/login-form.jsx";

const { signIn, replace, refresh } = vi.hoisted(() => ({
  signIn: vi.fn(), replace: vi.fn(), refresh: vi.fn(),
}));
vi.mock("next-auth/react", () => ({ signIn }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace, refresh }) }));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

async function fill() {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("Email address"), "owner@example.com");
  await user.type(screen.getByLabelText("Password"), "sample-password");
  return user;
}

describe("LoginForm", () => {
  it("validates email before contacting Auth.js", async () => {
    render(<LoginForm />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findAllByRole("alert")).not.toHaveLength(0);
    expect(signIn).not.toHaveBeenCalled();
  });

  it("signs in and navigates to the protected dashboard", async () => {
    signIn.mockResolvedValue({ ok: true, error: null });
    render(<LoginForm />);
    const user = await fill();
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(signIn).toHaveBeenCalledWith("credentials", {
      email: "owner@example.com", password: "sample-password", redirect: false, redirectTo: "/dashboard",
    });
    expect(replace).toHaveBeenCalledWith("/dashboard");
  });

  it("explains unverified emails and provides a resend link", async () => {
    signIn.mockResolvedValue({ error: "CredentialsSignin", code: "email_not_verified" });
    render(<LoginForm />);
    const user = await fill();
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Verify your email");
    expect(screen.getByRole("link", { name: "Request a new verification link" })).toHaveAttribute("href", "/resend-verification");
    expect(replace).not.toHaveBeenCalled();
  });

  it("does not distinguish unknown accounts from bad passwords", async () => {
    signIn.mockResolvedValue({ error: "CredentialsSignin", code: "invalid_credentials" });
    render(<LoginForm />);
    const user = await fill();
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid email or password");
    expect(replace).not.toHaveBeenCalled();
  });
});
