import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";

export function MobileAppShell({ children, fullScreen = false }: { children: React.ReactNode; fullScreen?: boolean }) {
  if (fullScreen) {
    return (
      <main className="min-h-screen bg-bg text-white lg:hidden">
        {children}
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-bg px-5 pb-28 pt-6 text-white lg:hidden">
      <div className="mx-auto max-w-md">{children}</div>
      <MobileBottomNav />
    </main>
  );
}
