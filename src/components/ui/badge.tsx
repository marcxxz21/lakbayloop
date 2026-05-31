import * as React from "react";
import { cn } from "@/lib/utils";

export function Badge({
  className,
  tone = "blue",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: "blue" | "teal" | "amber" | "red" }) {
  const tones = {
    blue: "border-[var(--blue-border)] bg-[var(--blue-soft)] text-blue",
    teal: "border-[var(--teal-border)] bg-[var(--teal-soft)] text-teal",
    amber: "border-[var(--amber-border)] bg-[var(--amber-soft)] text-amber",
    red: "border-[var(--red-border)] bg-[var(--red-soft)] text-red"
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold leading-none",
        tones[tone],
        className
      )}
      {...props}
    />
  );
}
