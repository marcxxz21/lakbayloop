import Link from "next/link";
import { ArrowRight, BarChart3, MapPinned, Route } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui-custom/glass-card";
import { DarkCard } from "@/components/ui-custom/dark-card";
import { RouteArt } from "@/components/commute/route-art";
import { appName, tagline } from "@/lib/constants";

const features = [
  { title: "Save daily routes", body: "Keep errands, appointments, work, school, and regular trips in one clean route library.", icon: Route },
  { title: "Log each ride", body: "Capture actual duration, crowd level, rating, and notes from the trip.", icon: MapPinned },
  { title: "Understand patterns", body: "Turn commute history into simple trends for better timing decisions.", icon: BarChart3 }
];

export default async function LandingPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const authError = typeof params?.error_description === "string" ? params.error_description : null;

  return (
    <main className="relative min-h-screen overflow-hidden bg-bg text-white">
      <div className="route-grid absolute inset-0 opacity-50" />
      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-5 py-6 lg:px-8">
        <nav className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-[14px] bg-blue">
              <MapPinned className="size-5 text-white" />
            </span>
            <span>
              <span className="block font-heading text-lg font-black">{appName}</span>
              <span className="block text-xs text-white/38">{tagline}</span>
            </span>
          </Link>
          <div className="hidden items-center gap-2 sm:flex">
            <Button asChild variant="secondary" className="hidden sm:inline-flex">
              <Link href="/auth/login">Open profile</Link>
            </Button>
            <Button asChild>
              <Link href="/auth/signup">Create profile</Link>
            </Button>
          </div>
        </nav>
        {authError ? (
          <section className="mt-6 rounded-[20px] border border-[var(--red-border)] bg-[var(--red-soft)] p-4 text-sm text-white/72">
            <p className="font-heading font-bold text-red">That old email link is no longer needed.</p>
            <p className="mt-1">{authError}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button asChild variant="secondary">
                <Link href="/auth/login">Open profile by email</Link>
              </Button>
              <Button asChild>
                <Link href="/auth/signup">Create profile</Link>
              </Button>
            </div>
          </section>
        ) : null}

        <section className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[1fr_0.95fr] lg:py-16">
          <div className="max-w-2xl">
            <p className="mb-5 inline-flex rounded-full border border-[var(--blue-border)] bg-[var(--blue-soft)] px-4 py-2 text-sm font-semibold text-blue">
              Daily commute support for every rider
            </p>
            <h1 className="font-heading text-4xl font-black leading-tight tracking-normal text-white sm:text-5xl lg:text-7xl lg:leading-[0.95]">
              {appName}
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-white/65">
              {tagline} Save routes, check conditions, log your ride, and understand your patterns over time.
            </p>
            <div className="mt-8 grid gap-3 sm:flex">
              <Button size="lg" className="w-full sm:w-auto" asChild>
                <Link href="/auth/signup">
                  Create profile
                  <ArrowRight className="size-5" />
                </Link>
              </Button>
              <Button size="lg" variant="secondary" className="w-full sm:w-auto" asChild>
                <Link href="/auth/login">Open profile</Link>
              </Button>
            </div>
          </div>

          <GlassCard className="relative min-h-[420px] overflow-hidden p-6 shadow-glow">
            <RouteArt />
            <div className="absolute bottom-5 left-5 right-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-bg/70 p-4 backdrop-blur-xl">
                <p className="text-xs text-white/38">Estimated</p>
                <p className="font-heading text-2xl font-black">28m</p>
              </div>
              <div className="rounded-2xl border border-[var(--amber-border)] bg-bg/70 p-4 backdrop-blur-xl">
                <p className="text-xs text-white/38">Rain</p>
                <p className="font-heading text-2xl font-black text-amber">40%</p>
              </div>
              <div className="rounded-2xl border border-[var(--teal-border)] bg-bg/70 p-4 backdrop-blur-xl">
                <p className="text-xs text-white/38">Logs</p>
                <p className="font-heading text-2xl font-black text-teal">18</p>
              </div>
            </div>
          </GlassCard>
        </section>

        <section className="grid gap-3 pb-8 md:grid-cols-3">
          {features.map((feature) => (
            <DarkCard key={feature.title} className="p-5">
              <feature.icon className="size-6 text-blue" />
              <h2 className="mt-4 font-heading text-lg font-black">{feature.title}</h2>
              <p className="mt-2 text-sm leading-6 text-white/55">{feature.body}</p>
            </DarkCard>
          ))}
        </section>

      </div>
    </main>
  );
}
