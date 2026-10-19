"use client";

import { useId } from "react";

// Precision geometric mark — a 4-point diamond with an inner accent.
// Used as the ForgeFlow brand identity. Scales fluidly with the `size` prop.
export function BrandMark({ size = 30, glow = false, className = "" }) {
  const id = useId().replace(/[:]/g, "");
  return (
    <span
      className={`ff-brand-mark ${className}`}
      style={{ width: size, height: size, filter: glow ? `drop-shadow(0 4px 16px rgba(34, 211, 238, 0.45))` : undefined }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="ForgeFlow">
        <defs>
          <linearGradient id={id + "-a"} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#06B6D4" />
          </linearGradient>
          <linearGradient id={id + "-b"} x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#1D4ED8" />
            <stop offset="100%" stopColor="#0891B2" />
          </linearGradient>
        </defs>
        <path d="M16 1.5 L30.5 16 L16 30.5 L1.5 16 Z" fill={`url(#${id}-a)`} />
        <path d="M16 7.5 L24.5 16 L16 24.5 L7.5 16 Z" fill="#0B1224" />
        <circle cx="16" cy="16" r="2.6" fill={`url(#${id}-b)`} />
        <path
          d="M16 7.5 L24.5 16"
          stroke="#22D3EE"
          strokeWidth="1.2"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}
