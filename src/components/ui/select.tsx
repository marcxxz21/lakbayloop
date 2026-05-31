import * as React from "react";
import { cn } from "@/lib/utils";

export function Select({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn("h-12 rounded-2xl border border-white/[0.08] bg-surface-soft px-4 text-sm text-white", className)} {...props} />;
}
