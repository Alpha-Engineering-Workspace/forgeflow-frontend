import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ResendVerificationForm } from "../../src/features/auth/components/resend-verification-form.jsx";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("ResendVerificationForm", () => {
  it("validates email before sending", async () => {
    const request = vi.fn();
    vi.stubGlobal("fetch", request);
    render(<ResendVerificationForm />);

    await userEvent.click(screen.getByRole("button", { name: "Send new verification link" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Enter a valid email address");
    expect(request).not.toHaveBeenCalled();
  });

  it("displays a generic success without revealing account existence", async () => {
    const request = vi.fn().mockResolvedValue(new Response(null, { status: 202 }));
    vi.stubGlobal("fetch", request);
    render(<ResendVerificationForm />);

    await userEvent.type(screen.getByLabelText("Email address"), "user@example.com");
    await userEvent.click(screen.getByRole("button", { name: "Send new verification link" }));

    expect(await screen.findByRole("status")).toHaveTextContent("If your account needs verification");
    expect(JSON.parse(request.mock.calls[0][1].body)).toEqual({ email: "user@example.com" });
  });
});
