import * as React from "react";
import { cn } from "@/lib/utils";

export function GradientBackground({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("route-grid absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_12%,rgba(91,142,240,0.16),transparent_30%),radial-gradient(circle_at_85%_88%,rgba(62,201,167,0.1),transparent_28%),linear-gradient(180deg,var(--bg-soft),var(--bg))]", className)}
      {...props}
    />
  );
}
