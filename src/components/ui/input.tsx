import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-12 w-full rounded-2xl border border-white/[0.08] bg-surface-soft px-4 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-blue/45",
        className
      )}
      {...props}
    />
  );
}
