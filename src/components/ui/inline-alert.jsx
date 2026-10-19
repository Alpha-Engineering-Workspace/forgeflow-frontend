import { AlertCircle, CheckCircle2, Info } from "lucide-react";

const tones = {
  error: { icon: AlertCircle, css: "ff-alert-error", role: "alert" },
  success: { icon: CheckCircle2, css: "ff-alert-success", role: "status" },
  info: { icon: Info, css: "ff-alert-info", role: "status" },
};

export function InlineAlert({ tone = "info", children, title }) {
  const { icon: Icon, css, role } = tones[tone] || tones.info;
  return (
    <div role={role} className={`ff-alert flex items-start gap-3 rounded-xl border p-4 text-sm leading-6 ${css}`}>
      <Icon size={19} className="mt-0.5 shrink-0" aria-hidden="true" />
      <div>{title && <p className="mb-1 font-semibold">{title}</p>}{children}</div>
    </div>
  );
}
