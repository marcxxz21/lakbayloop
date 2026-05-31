import { cn } from "@/lib/utils";

export function Progress({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("h-1.5 overflow-hidden rounded-full bg-white/[0.06]", className)}>
      <div className="h-full rounded-full bg-blue" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}
