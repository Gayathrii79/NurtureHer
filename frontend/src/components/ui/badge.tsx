import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-primary/10 bg-pink-50/90 px-3 py-1 text-xs font-bold text-primary shadow-sm dark:border-white/10 dark:bg-white/10 dark:text-pink-100",
        className,
      )}
      {...props}
    />
  );
}
