import Link from "next/link";
import { ArrowLeft, MapPinned } from "lucide-react";
import { SignupFormClient } from "@/components/features/auth-form-client";

export default function SignupPage() {
  return (
    <main className="min-h-screen bg-bg px-5 py-8 text-white">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.75fr_1fr]">
        <section className="lg:sticky lg:top-8 lg:h-fit">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-white/55 hover:text-white">
            <ArrowLeft className="size-4" />
            Back
          </Link>
          <div className="mt-10 flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-[16px] bg-blue">
              <MapPinned className="size-5" />
            </span>
            <span className="font-heading text-2xl font-black">LakbayLoop</span>
          </div>
          <h1 className="mt-8 max-w-lg font-heading text-5xl font-black leading-none">Set up your commute profile.</h1>
          <p className="mt-5 max-w-md leading-7 text-white/58">
            Start with your school or workplace and preferred commute mode. Supabase Auth will connect here in the next phase.
          </p>
        </section>
        <section className="rounded-[28px] border border-white/[0.08] bg-surface p-5 shadow-panel sm:p-7">
          <SignupFormClient />
        </section>
      </div>
    </main>
  );
}
