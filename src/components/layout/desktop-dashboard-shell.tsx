import { DesktopSidebar } from "@/components/layout/desktop-sidebar";
import { Topbar } from "@/components/layout/topbar";

export function DesktopDashboardShell({
  title,
  subtitle,
  children
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="hidden min-h-screen bg-bg text-white lg:flex">
      <DesktopSidebar />
      <main className="flex min-w-0 flex-1 flex-col">
        <Topbar title={title} subtitle={subtitle} />
        <div className="scroll-soft flex-1 overflow-y-auto p-7">{children}</div>
      </main>
    </div>
  );
}
