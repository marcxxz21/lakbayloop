import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";

export function MobileAppShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-bg px-5 pb-28 pt-6 text-white lg:hidden">
      <div className="mx-auto max-w-md">{children}</div>
      <MobileBottomNav />
    </main>
  );
}
