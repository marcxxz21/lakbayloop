import Link from "next/link";
import { ArrowLeft, MapPinned } from "lucide-react";
import { Button } from "@/components/ui/button";
import { appName } from "@/lib/constants";

export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-5 py-10 text-white">
      <div className="w-full max-w-md">
        <Link href="/auth/login" className="mb-10 inline-flex items-center gap-2 text-sm text-white/55 hover:text-white">
          <ArrowLeft className="size-4" />
          Back to login
        </Link>
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-[14px] bg-blue">
            <MapPinned className="size-5" />
          </span>
          <span className="font-heading text-xl font-black">{appName}</span>
        </div>
        <h1 className="mt-8 font-heading text-3xl font-black">No password needed</h1>
        <p className="mt-3 leading-7 text-white/55">{appName} now opens local profiles by email only, so Supabase reset emails are no longer part of the flow.</p>
        <div className="mt-8 grid gap-3">
          <Button asChild>
            <Link href="/auth/login">Open profile by email</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/auth/signup">Create profile</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
