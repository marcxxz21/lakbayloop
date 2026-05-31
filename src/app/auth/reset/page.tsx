import Link from "next/link";
import { ArrowLeft, MapPinned } from "lucide-react";
import { ResetPasswordFormClient } from "@/components/features/auth-form-client";

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
          <span className="font-heading text-xl font-black">LakbayLoop</span>
        </div>
        <h1 className="mt-8 font-heading text-4xl font-black">Reset password</h1>
        <p className="mt-3 text-white/55">Set a new password for your Supabase account.</p>
        <ResetPasswordFormClient />
      </div>
    </main>
  );
}
