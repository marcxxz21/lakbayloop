"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui-custom/search-input";

export function Topbar({ title, subtitle }: { title: string; subtitle: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const todayLabel = useMemo(() => {
    return new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }, []);

  function searchRoutes(event: FormEvent) {
    event.preventDefault();
    const trimmed = query.trim();
    router.push(trimmed ? `/routes?q=${encodeURIComponent(trimmed)}` : "/routes");
  }

  return (
    <header className="flex h-[70px] shrink-0 items-center justify-between border-b border-white/[0.05] bg-bg/60 px-7 backdrop-blur-xl">
      <div>
        <h1 className="font-heading text-xl font-black tracking-normal text-white">{title}</h1>
        <p className="mt-0.5 text-xs text-white/35">{subtitle}</p>
      </div>
      <div className="flex items-center gap-3">
        <form className="hidden xl:block" onSubmit={searchRoutes}>
          <SearchInput className="w-[240px]" value={query} onChange={setQuery} />
        </form>
        <div className="hidden items-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.04] px-4 py-2 text-xs text-white/42 sm:flex">
          <CalendarDays className="size-4" />
          {todayLabel}
        </div>
        <Button variant="secondary" size="icon" aria-label="Open insights" title="Open insights" asChild>
          <Link href="/insights">
            <Bell className="size-4" />
          </Link>
        </Button>
      </div>
    </header>
  );
}
