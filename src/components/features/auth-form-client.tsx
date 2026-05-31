"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { preferredModes } from "@/lib/constants";
import { apiFetch } from "@/lib/api-client";
import { setBrowserSessionId } from "@/lib/session";
import { createClient } from "@/lib/supabase/client";
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
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;
      if (!data.user) throw new Error("Login did not return a Supabase user.");

      setBrowserSessionId(data.user.id);
      await apiFetch("/api/profile", {
        method: "POST",
        body: JSON.stringify({
          full_name: data.user.user_metadata?.full_name || email.split("@")[0],
          email,
          school_or_workplace: data.user.user_metadata?.school_or_workplace || "Not set",
          preferred_mode: (data.user.user_metadata?.preferred_mode as PreferredMode | undefined) || "Mixed"
        })
      });
      window.location.href = "/dashboard";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to log in");
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
          <Input className="mt-2" type="email" placeholder="josie@example.com" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </div>
        <div>
          <Label>Password</Label>
          <Input className="mt-2" type="password" placeholder="Password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={6} />
        </div>
        {error ? <p className="rounded-2xl border border-[var(--red-border)] bg-[var(--red-soft)] p-3 text-sm text-red">{error}</p> : null}
        <Button className="w-full" disabled={loading}>
          <Mail className="size-4" />
          {loading ? "Opening..." : "Log in"}
        </Button>
      </form>
      <Button type="button" variant="secondary" className="w-full" onClick={continueDemo}>Continue in demo mode</Button>
    </div>
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
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            school_or_workplace: school,
            preferred_mode: mode
          }
        }
      });
      if (authError) throw authError;
      if (!data.user) throw new Error("Signup did not return a Supabase user.");

      setBrowserSessionId(data.user.id);
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
        <Input className="mt-2" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" required minLength={6} />
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
