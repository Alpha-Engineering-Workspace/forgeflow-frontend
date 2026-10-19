import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RegisterForm } from "@/features/auth/components/register-form";

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

async function enterValidDetails() {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("Full name"), "Demo Owner");
  await user.type(screen.getByLabelText("Email address"), "owner@example.com");
  await user.type(screen.getByLabelText("Password"), "safe-password-1234");
  return user;
}

describe("RegisterForm", () => {
  it("retains form values when the backend rejects registration", async () => {
    const request = vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: { message: "Email already in use" } }), { status: 409 }));
    vi.stubGlobal("fetch", request);
    render(<RegisterForm />);
    const user = await enterValidDetails();
    await user.click(screen.getByRole("button", { name: "Create account" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Email already in use");
    expect(screen.getByLabelText("Email address")).toHaveValue("owner@example.com");
    expect(screen.getByLabelText("Full name")).toHaveValue("Demo Owner");
    expect(request).toHaveBeenCalledWith("/api/backend/auth/register", expect.objectContaining({ method: "POST" }));
  });

  it("shows a verification instruction after account creation without promising delivery", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 201 })));
    render(<RegisterForm />);
    const user = await enterValidDetails();
    await user.click(screen.getByRole("button", { name: "Create account" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Check your inbox");
    expect(screen.getByRole("link", { name: /request a new link/i })).toHaveAttribute("href", "/resend-verification");
  });
});
