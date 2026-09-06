import { useState, useRef, useEffect, useCallback } from "react";
import { Bell, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { api, Alert } from "@/lib/api";
import { cn } from "@/lib/utils";

export function NotificationBell({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.notifications();
      setNotifications(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const handleToggle = () => {
    const nextState = !open;
    setOpen(nextState);
    if (nextState) {
      void fetchNotifications();
    }
  };

  const count = notifications.length;

  return (
    <div className={cn("relative inline-block text-left", className)} ref={dropdownRef}>
      <button
        type="button"
        id="notification-bell-button"
        onClick={handleToggle}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="Notifications"
        title="Notifications"
        className={cn(
          "group relative flex h-11 w-11 items-center justify-center rounded-2xl border border-pink-100 bg-white/90 shadow-card backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 dark:border-white/10 dark:bg-white/10",
          open && "border-primary/50 shadow-glow ring-2 ring-primary/20",
        )}
      >
        <Bell className="h-5 w-5 text-muted transition duration-200 group-hover:text-primary dark:text-white/60 dark:group-hover:text-pink-300" />
        {count > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-gradient-to-r from-primary to-rose-500 px-1 text-[11px] font-black text-white shadow-glow">
            {count > 99 ? "99+" : count}
          </span>
        ) : null}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Notifications panel"
          className="absolute right-0 top-full z-50 mt-2 w-80 sm:w-96 origin-top-right animate-in fade-in zoom-in-95 rounded-[24px] border border-pink-100 bg-white/95 p-4 shadow-glow backdrop-blur-2xl dark:border-white/10 dark:bg-[#241827]/95"
        >
          <div className="flex items-center justify-between border-b border-pink-50 pb-3 dark:border-white/10">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-ink dark:text-white">Notifications</h3>
              {count > 0 ? (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-black text-primary dark:bg-white/10 dark:text-pink-300">
                  {count}
                </span>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => void fetchNotifications()}
              disabled={loading}
              className="flex items-center gap-1 rounded-xl p-1.5 text-xs font-bold text-muted transition hover:bg-pink-50 hover:text-primary disabled:opacity-50 dark:hover:bg-white/10"
              title="Refresh notifications"
              aria-label="Refresh notifications"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin text-primary")} />
            </button>
          </div>

          <div className="mt-3 max-h-80 space-y-2 overflow-y-auto pr-1">
            {loading && !notifications.length ? (
              <div className="py-6 text-center text-sm font-semibold text-muted">
                <RefreshCw className="mx-auto mb-2 h-5 w-5 animate-spin text-primary" />
                Loading alerts...
              </div>
            ) : error ? (
              <div className="rounded-2xl bg-rose-50 p-3 text-center text-xs font-bold text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
                <AlertCircle className="mx-auto mb-1 h-5 w-5" />
                <p>{error}</p>
                <button
                  type="button"
                  onClick={() => void fetchNotifications()}
                  className="mt-2 text-xs font-black underline"
                >
                  Try again
                </button>
              </div>
            ) : notifications.length > 0 ? (
              notifications.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-pink-50 bg-pink-50/50 p-3 transition hover:bg-pink-50/90 dark:border-white/5 dark:bg-white/5 dark:hover:bg-white/10"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-bold text-ink dark:text-white leading-5">{item.message}</p>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black capitalize",
                        item.sent_status === "sent"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
                      )}
                    >
                      {item.sent_status.replace(/_/g, " ")}
                    </span>
                  </div>
                  {item.sent_at || item.created_at ? (
                    <p className="mt-1.5 text-[11px] font-semibold text-muted dark:text-white/40">
                      {new Date(item.sent_at ?? item.created_at ?? "").toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  ) : null}
                </div>
              ))
            ) : (
              <div className="py-8 text-center">
                <CheckCircle2 className="mx-auto mb-2 h-7 w-7 text-emerald-500/70" />
                <p className="text-xs font-black text-ink dark:text-white">All caught up!</p>
                <p className="mt-1 text-[11px] text-muted dark:text-white/50">
                  No alerts or high-risk notifications.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
