import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PillButton({ className, ...props }: ButtonProps) {
  return <Button className={cn("rounded-full", className)} {...props} />;
}
