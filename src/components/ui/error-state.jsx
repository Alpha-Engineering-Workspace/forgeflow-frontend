import { AlertCircle } from "lucide-react";
import { Button } from "./button";

export function ErrorState({ message = "Something went wrong.", onRetry }) {
  return (
    <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-800">
      <div className="flex items-center gap-2 font-semibold"><AlertCircle size={18} aria-hidden="true" /> Unable to load</div>
      <p className="mt-2 text-sm">{message}</p>
      {onRetry && <Button className="mt-4" variant="secondary" onClick={onRetry}>Try again</Button>}
    </div>
  );
}
