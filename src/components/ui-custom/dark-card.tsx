import * as React from "react";
import { cn } from "@/lib/utils";

export function DarkCard({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-[20px] border border-white/[0.055] bg-surface shadow-panel", className)} {...props} />;
}
