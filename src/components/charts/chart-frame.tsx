import { DarkCard } from "@/components/ui-custom/dark-card";

export function ChartFrame({
  title,
  subtitle,
  children
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <DarkCard className="p-5">
      <div className="mb-5">
        <h3 className="font-heading text-lg font-black text-white">{title}</h3>
        {subtitle ? <p className="mt-1 text-xs text-white/38">{subtitle}</p> : null}
      </div>
      <div className="h-64">{children}</div>
    </DarkCard>
  );
}
