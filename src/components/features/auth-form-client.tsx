"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Mail, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { preferredModes } from "@/lib/constants";
import { apiFetch } from "@/lib/api-client";
import { normalizeAccountEmail, rememberAccountEmail, setBrowserSessionId } from "@/lib/session";
import type { PreferredMode } from "@/lib/types";
import { cn } from "@/lib/utils";

export function LoginFormClient() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const normalizedEmail = normalizeAccountEmail(email);
      const result = await apiFetch<{ session_id: string }>("/api/local-auth", {
        method: "POST",
        body: JSON.stringify({ action: "login", email: normalizedEmail })
      });
      setBrowserSessionId(result.session_id);
      rememberAccountEmail(normalizedEmail);
      window.location.href = "/dashboard";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to open profile");
    } finally {
      setLoading(false);
    }
  }

  function continueDemo() {
    setBrowserSessionId("demo");
    window.location.href = "/dashboard";
  }

  return (
    <div className="mt-8 space-y-3">
      <form className="space-y-5" onSubmit={submit}>
        <div>
          <Label>Email</Label>
          <Input className="mt-2" type="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </div>
        {error ? <p className="rounded-2xl border border-[var(--red-border)] bg-[var(--red-soft)] p-3 text-sm text-red">{error}</p> : null}
        {message ? <p className="rounded-2xl border border-[var(--teal-border)] bg-[var(--teal-soft)] p-3 text-sm text-teal">{message}</p> : null}
        <Button className="w-full" disabled={loading}>
          <Mail className="size-4" />
          {loading ? "Opening..." : "Open profile"}
        </Button>
      </form>
      <Button type="button" variant="ghost" className="w-full" asChild>
        <Link href="/auth/signup">
          <UserPlus className="size-4" />
          Create another profile
        </Link>
      </Button>
      <Button type="button" variant="secondary" className="w-full" onClick={continueDemo}>Continue in demo mode</Button>
    </div>
  );
}

export function SignupFormClient() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [school, setSchool] = useState("");
  const [modes, setModes] = useState<PreferredMode[]>(["Jeepney"]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function toggleMode(mode: PreferredMode) {
    setModes((current) => {
      if (current.includes(mode)) {
        return current.length === 1 ? current : current.filter((item) => item !== mode);
      }
      return [...current, mode];
    });
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
      setMessage(null);
    try {
      const normalizedEmail = normalizeAccountEmail(email);
      const result = await apiFetch<{ session_id: string }>("/api/local-auth", {
        method: "POST",
        body: JSON.stringify({
          action: "create",
          full_name: fullName,
          email: normalizedEmail,
          school_or_workplace: school,
          preferred_mode: modes[0],
          preferred_modes: modes
        })
      });
      setBrowserSessionId(result.session_id);
      rememberAccountEmail(normalizedEmail);
      window.location.href = "/dashboard";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create local profile");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="grid gap-5 md:grid-cols-2" onSubmit={submit}>
      <div>
        <Label>Full name</Label>
        <Input className="mt-2" value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Full name" required />
      </div>
      <div>
        <Label>Email</Label>
        <Input className="mt-2" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" required />
      </div>
      <div>
        <Label>Common destination or area</Label>
        <Input className="mt-2" value={school} onChange={(event) => setSchool(event.target.value)} placeholder="Workplace, school, market, clinic, or area" required />
      </div>
      <div className="md:col-span-2">
        <Label>Preferred commute modes</Label>
        <div className="mt-3 flex flex-wrap gap-2">
          {preferredModes.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => toggleMode(item as PreferredMode)}
              className={cn("rounded-full border px-4 py-2 text-sm", modes.includes(item as PreferredMode) ? "border-[var(--blue-border)] bg-[var(--blue-soft)] text-blue" : "border-white/10 bg-white/[0.04] text-white/45")}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
      {error ? <p className="rounded-2xl border border-[var(--red-border)] bg-[var(--red-soft)] p-3 text-sm text-red md:col-span-2">{error}</p> : null}
      {message ? <p className="rounded-2xl border border-[var(--teal-border)] bg-[var(--teal-soft)] p-3 text-sm text-teal md:col-span-2">{message}</p> : null}
      <Button className="mt-3 w-full md:col-span-2" disabled={loading}>{loading ? "Creating..." : "Create profile"}</Button>
      <p className="text-center text-sm text-white/45 md:col-span-2">
        Already have a profile? <Link className="font-semibold text-blue" href="/auth/login">Open it</Link>
      </p>
    </form>
  );
}
