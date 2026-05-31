import { Badge } from "@/components/ui/badge";

export function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const tone = normalized.includes("success") || normalized.includes("good") || normalized.includes("complete")
    ? "teal"
    : normalized.includes("partial") || normalized.includes("moderate") || normalized.includes("crowd")
      ? "amber"
      : normalized.includes("fail") || normalized.includes("error")
        ? "red"
        : "blue";

  return <Badge tone={tone}>{status}</Badge>;
}
