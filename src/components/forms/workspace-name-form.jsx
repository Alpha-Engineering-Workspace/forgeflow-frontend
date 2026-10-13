"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const schema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(50, "Name must be 50 characters or less"),
});

export function WorkspaceNameForm() {
  const [previewName, setPreviewName] = useState("");
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: "" },
  });

  return (
    <form onSubmit={handleSubmit(({ name }) => setPreviewName(name))} noValidate className="space-y-3">
      <label htmlFor="workspace-name" className="block text-sm font-medium">Workspace name</label>
      <Input id="workspace-name" placeholder="Example: Acme Studio" aria-invalid={!!errors.name} aria-describedby={errors.name ? "workspace-name-error" : undefined} {...register("name")} />
      {errors.name && <p id="workspace-name-error" role="alert" className="text-sm text-red-700">{errors.name.message}</p>}
      <Button type="submit">Preview workspace name</Button>
      {previewName && <p role="status" className="text-sm text-[var(--ff-muted)]">Local preview: <strong>{previewName}</strong></p>}
      <p className="text-xs text-[var(--ff-muted)]">Demo only. Nothing is saved to a server.</p>
    </form>
  );
}
