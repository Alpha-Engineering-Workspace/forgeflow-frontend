import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PasswordField } from "@/components/ui/password-field";

afterEach(cleanup);

describe("PasswordField", () => {
  it("defaults to a masked input and exposes a keyboard-operable reveal control", async () => {
    const user = userEvent.setup();
    render(<div><label htmlFor="password-test">Password</label><PasswordField id="password-test" /></div>);
    const input = screen.getByLabelText("Password");
    expect(input).toHaveAttribute("type", "password");
    await user.click(screen.getByRole("button", { name: "Show password" }));
    expect(input).toHaveAttribute("type", "text");
    expect(screen.getByRole("button", { name: "Hide password" })).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("button", { name: "Hide password" }));
    expect(input).toHaveAttribute("type", "password");
  });
});
