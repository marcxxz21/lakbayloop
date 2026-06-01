"use client";

import { FormEvent, useEffect, useState } from "react";
import { LogOut, Save } from "lucide-react";
import { ResponsiveShell } from "@/components/layout/responsive-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DarkCard } from "@/components/ui-custom/dark-card";
import { apiFetch } from "@/lib/api-client";
import { appName, preferredModes } from "@/lib/constants";
import { clearBrowserSessionId } from "@/lib/session";
import type { AppUser, PreferredMode } from "@/lib/types";
import { cn } from "@/lib/utils";

export function SettingsClient() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [school, setSchool] = useState("");
  const [modes, setModes] = useState<PreferredMode[]>(["Mixed"]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<{ user: AppUser | null }>("/api/profile")
      .then(({ user }) => {
        if (!user) return;
        setFullName(user.full_name);
        setEmail(user.email ?? "");
        setSchool(user.school_or_workplace);
        setModes(user.preferred_modes?.length ? user.preferred_modes : [user.preferred_mode]);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load settings"));
  }, []);

  function toggleMode(mode: PreferredMode) {
    setModes((current) => {
      if (current.includes(mode)) {
        return current.length === 1 ? current : current.filter((item) => item !== mode);
      }
      return [...current, mode];
    });
  }

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await apiFetch("/api/profile", {
        method: "POST",
        body: JSON.stringify({
          full_name: fullName,
          email,
          school_or_workplace: school,
          preferred_mode: modes[0],
          preferred_modes: modes
        })
      });
      setMessage("Settings saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save settings");
    } finally {
      setSaving(false);
    }
  }

  function signOut() {
    clearBrowserSessionId();
    window.location.href = "/auth/login";
  }

  const content = (
    <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
      <DarkCard className="p-5">
        <form className="space-y-5" onSubmit={saveProfile}>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Full name</Label>
              <Input className="mt-2" value={fullName} onChange={(event) => setFullName(event.target.value)} required />
            </div>
            <div>
              <Label>Email</Label>
              <Input className="mt-2" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
            </div>
            <div className="md:col-span-2">
              <Label>Common destination or area</Label>
              <Input className="mt-2" value={school} onChange={(event) => setSchool(event.target.value)} required />
            </div>
          </div>
          <div>
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
          {error ? <p className="rounded-2xl border border-[var(--red-border)] bg-[var(--red-soft)] p-3 text-sm text-red">{error}</p> : null}
          {message ? <p className="rounded-2xl border border-[var(--teal-border)] bg-[var(--teal-soft)] p-3 text-sm text-teal">{message}</p> : null}
          <Button disabled={saving}>
            <Save className="size-4" />
            {saving ? "Saving..." : "Save settings"}
          </Button>
        </form>
      </DarkCard>
      <DarkCard className="h-fit p-5">
        <p className="text-xs font-bold uppercase tracking-[0.08em] text-white/35">Account</p>
        <h2 className="mt-2 font-heading text-2xl font-black">Session controls</h2>
        <p className="mt-3 text-sm leading-6 text-white/50">Sign out clears the local {appName} profile session in this browser.</p>
        <Button variant="secondary" className="mt-5 w-full" onClick={signOut}>
          <LogOut className="size-4" />
          Sign out
        </Button>
      </DarkCard>
    </div>
  );

  const mobile = (
    <div className="space-y-5">
      <header>
        <p className="text-sm text-white/38">Account preferences</p>
        <h1 className="font-heading text-3xl font-black">Settings</h1>
      </header>
      {content}
    </div>
  );

  return (
    <ResponsiveShell title="Settings" subtitle="Update your commute profile and account session." mobile={mobile}>
      {content}
    </ResponsiveShell>
  );
}
