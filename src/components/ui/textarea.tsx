import * as React from "react";
import { cn } from "@/lib/utils";

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-28 w-full rounded-2xl border border-white/[0.08] bg-surface-soft px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-blue/45",
        className
      )}
      {...props}
    />
  );
}
