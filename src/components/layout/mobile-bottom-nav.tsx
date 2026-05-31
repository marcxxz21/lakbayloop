"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Home, MapPinned, Plus, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { label: "Home", href: "/dashboard", icon: Home },
  { label: "Routes", href: "/routes", icon: MapPinned },
  { label: "Log", href: "/logs", icon: Plus, center: true },
  { label: "Insights", href: "/insights", icon: BarChart3 },
  { label: "Profile", href: "/settings", icon: UserRound }
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-3 bottom-4 z-50 mx-auto flex max-w-md items-center justify-around rounded-[26px] border border-white/[0.08] bg-surface/95 px-2 py-2 shadow-panel backdrop-blur-2xl lg:hidden">
      {items.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.label}
            href={item.href}
            className={cn(
              "flex min-w-12 flex-col items-center gap-1 rounded-[18px] px-2.5 py-1.5 text-[10px] font-semibold text-white/32 transition",
              active && "bg-[var(--blue-soft)] text-blue",
              item.center && "bg-blue px-4 py-2 text-white shadow-glow"
            )}
            aria-label={item.label}
          >
            <item.icon className={cn("size-5", item.center ? "text-white" : active ? "text-blue" : "text-white/32")} />
            {!item.center ? <span>{item.label}</span> : null}
          </Link>
        );
      })}
    </nav>
  );
}
