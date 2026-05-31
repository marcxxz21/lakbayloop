import { Bell, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui-custom/search-input";

export function Topbar({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header className="flex h-[70px] shrink-0 items-center justify-between border-b border-white/[0.05] bg-bg/60 px-7 backdrop-blur-xl">
      <div>
        <h1 className="font-heading text-xl font-black tracking-normal text-white">{title}</h1>
        <p className="mt-0.5 text-xs text-white/35">{subtitle}</p>
      </div>
      <div className="flex items-center gap-3">
        <SearchInput className="hidden w-[240px] xl:flex" />
        <div className="hidden items-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.04] px-4 py-2 text-xs text-white/42 sm:flex">
          <CalendarDays className="size-4" />
          May 31, 2026
        </div>
        <Button variant="secondary" size="icon" aria-label="Notifications">
          <Bell className="size-4" />
        </Button>
      </div>
    </header>
  );
}
