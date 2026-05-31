import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "blue" | "teal" | "amber" | "red";

const toneClasses: Record<Tone, string> = {
  blue: "bg-[var(--blue-soft)] text-blue border-[var(--blue-border)]",
  teal: "bg-[var(--teal-soft)] text-teal border-[var(--teal-border)]",
  amber: "bg-[var(--amber-soft)] text-amber border-[var(--amber-border)]",
  red: "bg-[var(--red-soft)] text-red border-[var(--red-border)]"
};

export function MetricCard({
  label,
  value,
  sub,
  tone = "blue",
  icon: Icon,
  className
}: {
  label: string;
  value: string;
  sub: string;
  tone?: Tone;
  icon?: LucideIcon;
  className?: string;
}) {
  return (
    <div className={cn("relative overflow-hidden rounded-[20px] border border-white/[0.055] bg-surface p-5", className)}>
      <div className="absolute -right-6 -top-6 size-24 rounded-full bg-white/[0.025]" />
      {Icon ? (
        <div className={cn("mb-4 flex size-10 items-center justify-center rounded-[14px] border", toneClasses[tone])}>
          <Icon className="size-5" />
        </div>
      ) : null}
      <p className="text-xs font-bold uppercase tracking-[0.08em] text-white/35">{label}</p>
      <p className="mt-2 font-heading text-4xl font-black leading-none text-white">{value}</p>
      <p className={cn("mt-2 text-xs font-semibold", tone === "red" ? "text-red" : tone === "amber" ? "text-amber" : tone === "teal" ? "text-teal" : "text-blue")}>
        {sub}
      </p>
    </div>
  );
}
