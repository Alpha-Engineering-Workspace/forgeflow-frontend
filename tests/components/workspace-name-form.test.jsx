import { it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WorkspaceNameForm } from "@/components/forms/workspace-name-form";

it("validates a workspace name before showing the local preview", async () => {
  const user = userEvent.setup();
  render(<WorkspaceNameForm />);

  await user.click(screen.getByRole("button", { name: /preview workspace name/i }));
  expect(await screen.findByRole("alert")).toHaveTextContent("at least 2 characters");

  await user.type(screen.getByLabelText("Workspace name"), "Acme Studio");
  await user.click(screen.getByRole("button", { name: /preview workspace name/i }));

  expect(await screen.findByRole("status")).toHaveTextContent("Local preview: Acme Studio");
});
