"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { preferredModes } from "@/lib/constants";
import { apiFetch } from "@/lib/api-client";
import type { PreferredMode } from "@/lib/types";
import { cn } from "@/lib/utils";

export function LoginFormClient() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await apiFetch("/api/profile", {
        method: "POST",
        body: JSON.stringify({
          full_name: "Josie Dela Cruz",
          email,
          school_or_workplace: "UP Manila",
          preferred_mode: "Mixed"
        })
      });
      window.location.href = "/dashboard";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to log in");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="mt-8 space-y-5" onSubmit={submit}>
      <div>
        <Label>Email</Label>
        <Input className="mt-2" type="email" placeholder="josie@example.com" value={email} onChange={(event) => setEmail(event.target.value)} required />
      </div>
      <div>
        <Label>Password</Label>
        <Input className="mt-2" type="password" placeholder="••••••••" value={password} onChange={(event) => setPassword(event.target.value)} required />
      </div>
      {error ? <p className="rounded-2xl border border-[var(--red-border)] bg-[var(--red-soft)] p-3 text-sm text-red">{error}</p> : null}
      <Button className="w-full" disabled={loading}>
        <Mail className="size-4" />
        {loading ? "Opening..." : "Log in"}
      </Button>
    </form>
  );
}

export function SignupFormClient() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [school, setSchool] = useState("");
  const [mode, setMode] = useState<PreferredMode>("Jeepney");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await apiFetch("/api/profile", {
        method: "POST",
        body: JSON.stringify({
          full_name: fullName,
          email,
          school_or_workplace: school,
          preferred_mode: mode
        })
      });
      window.location.href = "/dashboard";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create profile");
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
        <Label>Password</Label>
        <Input className="mt-2" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" required />
      </div>
      <div>
        <Label>School or workplace</Label>
        <Input className="mt-2" value={school} onChange={(event) => setSchool(event.target.value)} placeholder="School or workplace" required />
      </div>
      <div className="md:col-span-2">
        <Label>Preferred commute mode</Label>
        <div className="mt-3 flex flex-wrap gap-2">
          {preferredModes.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setMode(item as PreferredMode)}
              className={cn("rounded-full border px-4 py-2 text-sm", mode === item ? "border-[var(--blue-border)] bg-[var(--blue-soft)] text-blue" : "border-white/10 bg-white/[0.04] text-white/45")}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
      {error ? <p className="rounded-2xl border border-[var(--red-border)] bg-[var(--red-soft)] p-3 text-sm text-red md:col-span-2">{error}</p> : null}
      <Button className="mt-3 w-full md:col-span-2" disabled={loading}>{loading ? "Creating..." : "Create account"}</Button>
      <p className="text-center text-sm text-white/45 md:col-span-2">
        Already have an account? <Link className="font-semibold text-blue" href="/auth/login">Log in</Link>
      </p>
    </form>
  );
}
