"use client";

import { useEffect, useState } from "react";
import { DesktopDashboardShell } from "@/components/layout/desktop-dashboard-shell";
import { MobileAppShell } from "@/components/layout/mobile-app-shell";

export function ResponsiveShell({
  title,
  subtitle,
  mobile,
  mobileFullScreen = false,
  children
}: {
  title: string;
  subtitle: string;
  mobile?: React.ReactNode;
  mobileFullScreen?: boolean;
  children: React.ReactNode;
}) {
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop(media.matches);

    update();
    media.addEventListener("change", update);

    return () => media.removeEventListener("change", update);
  }, []);

  if (isDesktop) {
    return (
      <DesktopDashboardShell title={title} subtitle={subtitle}>
        {children}
      </DesktopDashboardShell>
    );
  }

  return (
    <MobileAppShell fullScreen={mobileFullScreen}>{mobile ?? children}</MobileAppShell>
  );
}
