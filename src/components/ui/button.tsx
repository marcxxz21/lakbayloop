import * as React from "react";
import { cn } from "@/lib/utils";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "teal" | "danger";
  size?: "sm" | "md" | "lg" | "icon";
  asChild?: boolean;
};

const variants = {
  primary: "bg-white text-[#080A0F] hover:bg-white/88",
  secondary: "border border-white/10 bg-white/[0.065] text-white hover:bg-white/[0.095]",
  ghost: "bg-transparent text-white/65 hover:bg-white/[0.06] hover:text-white",
  teal: "border border-[var(--teal-border)] bg-[var(--teal-soft)] text-teal hover:bg-[rgba(62,201,167,0.16)]",
  danger: "border border-[var(--red-border)] bg-[var(--red-soft)] text-red hover:bg-[rgba(224,92,92,0.15)]"
};

const sizes = {
  sm: "h-9 px-4 text-xs",
  md: "h-11 px-5 text-sm",
  lg: "h-[52px] px-6 py-4 text-base",
  icon: "h-10 w-10 p-0"
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  asChild,
  children,
  ...props
}: ButtonProps) {
  const composedClassName = cn(
    "inline-flex items-center justify-center gap-2 rounded-full font-heading font-bold transition focus:outline-none focus:ring-2 focus:ring-blue/45 disabled:pointer-events-none disabled:opacity-50",
    variants[variant],
    sizes[size],
    className
  );

  if (asChild && React.isValidElement<{ className?: string }>(children)) {
    return React.cloneElement(children, {
      className: cn(composedClassName, children.props.className)
    });
  }

  return (
    <button
      className={composedClassName}
      {...props}
    >
      {children}
    </button>
  );
}
