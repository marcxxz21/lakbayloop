import Link from "next/link";
import { ArrowLeft, MapPinned } from "lucide-react";
import { GlassCard } from "@/components/ui-custom/glass-card";
import { RouteArt } from "@/components/commute/route-art";
import { LoginFormClient } from "@/components/features/auth-form-client";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen bg-bg text-white lg:grid-cols-[0.95fr_1.05fr]">
      <section className="hidden items-center justify-center p-8 lg:flex">
        <GlassCard className="h-full max-h-[780px] w-full max-w-2xl overflow-hidden p-8">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-white/55 hover:text-white">
            <ArrowLeft className="size-4" />
            Back
          </Link>
          <div className="mt-10">
            <p className="text-sm font-semibold text-blue">Welcome back</p>
            <h1 className="mt-3 max-w-lg font-heading text-6xl font-black leading-none">Check today&apos;s commute context.</h1>
          </div>
          <RouteArt />
        </GlassCard>
      </section>
      <section className="flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-md">
          <Link href="/" className="mb-10 flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-[14px] bg-blue">
              <MapPinned className="size-5" />
            </span>
            <span className="font-heading text-xl font-black">LakbayLoop</span>
          </Link>
          <h2 className="font-heading text-4xl font-black">Log in</h2>
          <p className="mt-3 text-white/55">Open your saved routes, ride logs, and mobility insights.</p>
          <LoginFormClient />
          <p className="mt-6 text-center text-sm text-white/45">
            No account? <Link className="font-semibold text-blue" href="/auth/signup">Sign up</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
