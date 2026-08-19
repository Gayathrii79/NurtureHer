import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant = "primary", ...props }, ref) => {
  const variants = {
    primary: "bg-gradient-to-r from-primary to-accent text-white shadow-glow hover:-translate-y-0.5",
    secondary: "bg-white text-ink shadow-card hover:-translate-y-0.5 dark:bg-white/10 dark:text-white",
    ghost: "bg-transparent text-muted hover:bg-white/70 dark:text-white/70 dark:hover:bg-white/10",
    danger: "bg-rose-600 text-white shadow-card hover:-translate-y-0.5",
  };
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-bold outline-none transition duration-200 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-primary/40 disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
});

Button.displayName = "Button";
