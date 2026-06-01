import { cn } from "@/lib/utils";

export function AppLogoMark({ className, imageClassName }: { className?: string; imageClassName?: string }) {
  return (
    <span className={cn("flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-[12px] bg-transparent", className)}>
      <img src="/kalakbay_logo.png" alt="Kalakbay logo" className={cn("h-full w-full object-contain", imageClassName)} />
    </span>
  );
}
