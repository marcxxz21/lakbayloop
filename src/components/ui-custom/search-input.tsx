import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export function SearchInput({ placeholder = "Search routes", className }: { placeholder?: string; className?: string }) {
  return (
    <div className={cn("flex h-10 min-w-0 items-center gap-2 rounded-full border border-white/[0.08] bg-surface-soft px-4 text-white/25", className)}>
      <Search className="size-4 shrink-0" />
      <span className="truncate text-sm">{placeholder}</span>
    </div>
  );
}
