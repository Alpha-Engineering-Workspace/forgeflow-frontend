import { AlertCircle, CheckCircle2, Info, AlertTriangle } from "lucide-react";

const tones = {
  error: { icon: AlertCircle, css: "ff-alert-error", role: "alert" },
  success: { icon: CheckCircle2, css: "ff-alert-success", role: "status" },
  info: { icon: Info, css: "ff-alert-info", role: "status" },
  warn: { icon: AlertTriangle, css: "ff-alert-warn", role: "status" },
};

export function InlineAlert({ tone = "info", children, title, className = "" }) {
  const { icon: Icon, css, role } = tones[tone] || tones.info;
  return (
    <div
      role={role}
      className={`ff-alert flex items-start gap-3 rounded-[12px] border p-3.5 text-[13.5px] leading-[1.55] ${css} ${className}`}
    >
      <span
        aria-hidden="true"
        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] bg-white/65"
      >
        <Icon size={15} />
      </span>
      <div className="min-w-0 flex-1 pt-0.5">
        {title && <p className="mb-0.5 text-[13px] font-semibold tracking-[-0.005em]">{title}</p>}
        <div className="text-[13px] leading-[1.55]">{children}</div>
      </div>
    </div>
  );
}
