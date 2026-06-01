import { cn } from "@/lib/utils";

export function AppLogoMark({ className, imageClassName }: { className?: string; imageClassName?: string }) {
  return (
    <span className={cn("flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-[14px] bg-blue shadow-[0_10px_24px_rgba(91,142,240,0.18)]", className)}>
      <img src="/kalakbay_logo.png" alt="Kalakbay logo" className={cn("h-full w-full object-cover", imageClassName)} />
    </span>
  );
}
