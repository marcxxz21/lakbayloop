"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Database, Home, MapPinned, PlusCircle, Route, Settings } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { mockUser } from "@/lib/mock-data";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: Home },
  { label: "Routes", href: "/routes", icon: Route },
  { label: "Log Ride", href: "/logs", icon: PlusCircle },
  { label: "Insights", href: "/insights", icon: BarChart3 },
  { label: "Pipeline", href: "/logs", icon: Database },
  { label: "Settings", href: "/dashboard", icon: Settings }
];

export function DesktopSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden h-screen w-[272px] shrink-0 flex-col border-r border-white/[0.06] bg-[#0B0E14]/92 backdrop-blur-2xl lg:flex">
      <div className="border-b border-white/[0.05] p-5">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-[13px] bg-blue">
            <MapPinned className="size-5 text-white" />
          </span>
          <span>
            <span className="block font-heading text-lg font-black text-white">LakbayLoop</span>
            <span className="block text-xs text-white/35">Plan. Log. Learn.</span>
          </span>
        </Link>
      </div>

      <nav className="scroll-soft flex-1 overflow-y-auto p-3">
        <p className="px-3 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-white/25">Workspace</p>
        <div className="space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.href || (pathname === "/logs" && item.label === "Pipeline");
            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold text-white/38 transition hover:bg-white/[0.045] hover:text-white/75",
                  active && "border border-[var(--blue-border)] bg-[var(--blue-soft)] text-white"
                )}
              >
                <item.icon className={cn("size-[18px] text-white/35", active && "text-blue")} />
                {item.label}
              </Link>
            );
          })}
        </div>
        <div className="mt-5 flex items-center gap-2 rounded-2xl border border-[var(--amber-border)] bg-[var(--amber-soft)] px-3 py-3">
          <span className="size-2 rounded-full bg-amber" />
          <p className="text-xs text-white/45">
            Pipeline <b className="text-amber">partial</b>
          </p>
        </div>
      </nav>

      <div className="border-t border-white/[0.05] p-3">
        <div className="flex items-center gap-3 rounded-2xl p-3 transition hover:bg-white/[0.04]">
          <Avatar initials={mockUser.initials} />
          <div className="min-w-0">
            <p className="truncate font-heading text-sm font-bold text-white">{mockUser.name}</p>
            <p className="truncate text-xs text-white/32">{mockUser.schoolOrWorkplace}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
