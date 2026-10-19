import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { VerifyEmailForm } from "@/features/auth/components/verify-email-form";

const { getParams } = vi.hoisted(() => ({ getParams: vi.fn() }));
vi.mock("next/navigation", () => ({ useSearchParams: getParams }));

afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); vi.clearAllMocks(); });

describe("VerifyEmailForm", () => {
  it("never consumes token on initial GET/render; requires an explicit click", async () => {
    const request = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", request);
    vi.spyOn(window.history, "replaceState").mockImplementation(() => {});
    getParams.mockReturnValue(new URLSearchParams("token=" + "a".repeat(45)));
    render(<VerifyEmailForm />);
    expect(request).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Verify my email" }));
    expect(request).toHaveBeenCalledWith("/api/backend/auth/email/verify", expect.objectContaining({ method: "POST" }));
    expect(await screen.findByRole("status")).toHaveTextContent("verified");
  });

  it("gives a recovery path for a missing or malformed token", () => {
    getParams.mockReturnValue(new URLSearchParams());
    render(<VerifyEmailForm />);
    expect(screen.getByRole("alert")).toHaveTextContent("missing or invalid");
    expect(screen.getByRole("link", { name: /request a new verification email/i })).toHaveAttribute("href", "/resend-verification");
  });
});
