import { AlertCircle, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";

export function LoadingSkeleton() {
  return (
    <div className="space-y-5">
      <div className="h-28 animate-pulse rounded-[28px] bg-white/70 shadow-card dark:bg-white/10" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-36 animate-pulse rounded-card bg-white/70 shadow-card dark:bg-white/10" />
        ))}
      </div>
      <div className="h-80 animate-pulse rounded-card bg-white/70 shadow-card dark:bg-white/10" />
    </div>
  );
}

export function EmptyState({ title = "No records yet", text = "New information will appear here as soon as it is available." }) {
  return (
    <Card className="flex min-h-48 flex-col items-center justify-center text-center">
      <Sparkles className="mb-3 h-8 w-8 text-primary" />
      <h3 className="font-semibold text-ink dark:text-white">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-muted dark:text-white/60">{text}</p>
    </Card>
  );
}

export function ErrorState() {
  return (
    <Card className="flex min-h-48 flex-col items-center justify-center text-center">
      <AlertCircle className="mb-3 h-8 w-8 text-rose-500" />
      <h3 className="font-semibold text-ink dark:text-white">Something needs attention</h3>
      <p className="mt-2 max-w-sm text-sm text-muted dark:text-white/60">Please refresh or try again shortly.</p>
    </Card>
  );
}
