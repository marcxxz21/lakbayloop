import { Filter } from "lucide-react";
import { AddRouteForm } from "@/components/commute/add-route-form";
import { RouteCard } from "@/components/commute/route-card";
import { RouteLogForm } from "@/components/commute/route-log-form";
import { ResponsiveShell } from "@/components/layout/responsive-shell";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui-custom/search-input";
import { StatusBadge } from "@/components/ui-custom/status-badge";
import { mockRoutes } from "@/lib/mock-data";

function MobileRoutes() {
  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm text-white/38">Saved commutes</p>
          <h1 className="font-heading text-4xl font-black">My Routes</h1>
        </div>
        <AddRouteForm />
      </header>
      <SearchInput className="h-12 w-full" />
      <div className="space-y-3">
        {mockRoutes.map((route) => <RouteCard key={route.id} route={route} />)}
      </div>
    </div>
  );
}

function DesktopRoutes() {
  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SearchInput className="h-11 w-full sm:w-80" />
          <div className="flex gap-2">
            <Button variant="secondary">
              <Filter className="size-4" />
              Filter
            </Button>
            <AddRouteForm />
          </div>
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          {mockRoutes.map((route) => <RouteCard key={route.id} route={route} />)}
        </div>
      </section>
      <aside className="h-fit rounded-[24px] border border-white/[0.065] bg-surface p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-white/35">Selected route</p>
            <h2 className="mt-2 font-heading text-2xl font-black">{mockRoutes[0].routeName}</h2>
          </div>
          <StatusBadge status="Good" />
        </div>
        <div className="mt-5 space-y-3 text-sm text-white/65">
          <div className="flex justify-between rounded-2xl bg-white/[0.035] p-3"><span>Origin</span><b className="text-white">{mockRoutes[0].originName}</b></div>
          <div className="flex justify-between rounded-2xl bg-white/[0.035] p-3"><span>Destination</span><b className="text-white">{mockRoutes[0].destinationName}</b></div>
          <div className="flex justify-between rounded-2xl bg-white/[0.035] p-3"><span>Preferred mode</span><b className="text-white">{mockRoutes[0].mode}</b></div>
          <div className="flex justify-between rounded-2xl bg-white/[0.035] p-3"><span>Estimated</span><b className="text-white">{mockRoutes[0].estimatedMinutes} min</b></div>
        </div>
        <div className="mt-5">
          <RouteLogForm buttonLabel="Log this route" />
        </div>
      </aside>
    </div>
  );
}

export default function RoutesPage() {
  return (
    <ResponsiveShell title="Routes" subtitle="Manage saved commutes and route details." mobile={<MobileRoutes />}>
      <DesktopRoutes />
    </ResponsiveShell>
  );
}
