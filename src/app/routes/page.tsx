import { Suspense } from "react";
import { RoutesPageClient } from "@/components/features/routes-client";

export default function RoutesPage() {
  return (
    <Suspense fallback={null}>
      <RoutesPageClient />
    </Suspense>
  );
}
