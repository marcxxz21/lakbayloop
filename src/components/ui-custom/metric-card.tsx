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
  const hasLongValue = value.length > 7;

  return (
    <div className={cn("relative min-w-0 overflow-hidden rounded-[18px] border border-white/[0.055] bg-surface p-4 sm:rounded-[20px] sm:p-5", className)}>
      <div className="absolute -right-6 -top-6 size-20 rounded-full bg-white/[0.025] sm:size-24" />
      {Icon ? (
        <div className={cn("mb-4 flex size-9 items-center justify-center rounded-[13px] border sm:size-10 sm:rounded-[14px]", toneClasses[tone])}>
          <Icon className="size-4 sm:size-5" />
        </div>
      ) : null}
      <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-white/35 sm:text-xs sm:tracking-[0.08em]">{label}</p>
      <p className={cn("mt-2 min-w-0 break-words font-heading font-black leading-[0.96] text-white", hasLongValue ? "text-[1.75rem] sm:text-4xl" : "text-[1.9rem] sm:text-4xl")}>{value}</p>
      <p className={cn("mt-2 min-w-0 break-words text-[11px] font-semibold leading-snug sm:text-xs", tone === "red" ? "text-red" : tone === "amber" ? "text-amber" : tone === "teal" ? "text-teal" : "text-blue")}>
        {sub}
      </p>
    </div>
  );
}
