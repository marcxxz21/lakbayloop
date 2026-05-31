import { cn } from "@/lib/utils";

export function Avatar({ initials, className }: { initials: string; className?: string }) {
  return (
    <div className={cn("flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-blue to-[#8BB4FF] font-heading text-sm font-black text-bg", className)}>
      {initials}
    </div>
  );
}
