import { Bell, Moon, PhoneCall, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, Alert } from "@/lib/api";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LanguageSelector } from "@/components/common/LanguageSelector";
import { useAuth } from "@/context/useAuth";
import { useLanguage } from "@/context/useLanguage";

export function Topbar() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [dark, setDark] = useState(() => localStorage.getItem("nurtureher_theme") === "dark");
  const [alerts, setAlerts] = useState<Alert[] | null>(null);
  const [alertsOpen, setAlertsOpen] = useState(false);

  useEffect(() => {
    // Real unread-style bell: the count is the caller's own alert list from GET /notifications.
    api
      .notifications()
      .then(setAlerts)
      .catch(() => setAlerts([]));
  }, []);

  const alertCount = alerts?.length ?? 0;
  const initials =
    user?.name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "NH";

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("nurtureher_theme", dark ? "dark" : "light");
  }, [dark]);

  return (
    <header className="sticky top-0 z-20 border-b border-lavender-100 bg-background/80 px-4 py-3 backdrop-blur-2xl dark:border-white/10 dark:bg-[#181326]/80 md:px-8 md:py-4">
      <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-3 pl-14 lg:pl-0">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-bold text-muted dark:text-white/60 sm:text-sm">
            {t.topbar.welcome}, {user?.name ?? ""}
          </p>
          <h2 className="truncate text-base font-black text-ink dark:text-white sm:text-xl">
            {t.topbar.dashboardReady}
          </h2>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {/* Emergency SOS Quick Button */}
          <button
            type="button"
            onClick={() => navigate("/emergency")}
            className="flex h-10 items-center gap-1.5 rounded-2xl border border-rose-200 bg-rose-50/80 px-3 text-xs font-black text-rose-600 shadow-xs transition hover:bg-rose-100 hover:text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300"
            title={t.emergency.callBtn}
          >
            <PhoneCall className="h-3.5 w-3.5 animate-pulse text-rose-500" />
            <span className="hidden sm:inline">SOS 112</span>
          </button>

          <div className="relative">
            <Button
              variant="secondary"
              className="relative h-10 w-10 px-0 rounded-2xl"
              aria-label={t.notifications.title}
              title={t.notifications.title}
              onClick={() => setAlertsOpen((open) => !open)}
            >
              <Bell className="h-4 w-4" />
              {alertCount > 0 ? (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-black text-white">
                  {alertCount}
                </span>
              ) : null}
            </Button>

            {alertsOpen ? (
              <div className="absolute right-0 z-30 mt-2 w-80 rounded-2xl border border-lavender-200 bg-white p-3 shadow-glow dark:border-white/10 dark:bg-[#181326]">
                <div className="flex items-center justify-between px-1 pb-2">
                  <p className="text-xs font-black text-ink dark:text-white">{t.notifications.title}</p>
                  <button
                    type="button"
                    className="text-[11px] font-bold text-muted hover:text-primary"
                    onClick={() => setAlertsOpen(false)}
                  >
                    {t.ui.close}
                  </button>
                </div>
                {alerts === null ? (
                  <p className="px-1 py-3 text-xs text-muted">...</p>
                ) : alerts.length === 0 ? (
                  <p className="px-1 py-3 text-xs leading-5 text-muted dark:text-white/60">{t.notifications.empty}</p>
                ) : (
                  <ul className="max-h-72 space-y-2 overflow-y-auto">
                    {alerts.slice(0, 15).map((alert) => (
                      <li key={alert.id} className="rounded-xl border border-lavender-100 bg-lavender-50/60 p-2.5 dark:border-white/10 dark:bg-white/5">
                        <p className="text-[11px] leading-4 text-ink dark:text-white">{alert.message}</p>
                        <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-muted">
                          {alert.sent_status} · {alert.sent_at ? new Date(alert.sent_at).toLocaleString() : "queued"}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : null}
          </div>

          <LanguageSelector />

          <Button
            variant="secondary"
            className="h-10 w-10 px-0 rounded-2xl"
            onClick={() => setDark((value) => !value)}
            aria-label={dark ? t.topbar.lightMode : t.topbar.darkMode}
            title={dark ? t.topbar.lightMode : t.topbar.darkMode}
          >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          <button
            type="button"
            onClick={() => navigate("/profile")}
            className="flex min-h-10 items-center gap-2 rounded-2xl border border-lavender-100 bg-white/90 px-1.5 py-1 shadow-card backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 dark:border-white/10 dark:bg-white/10 sm:pr-3"
            aria-label={t.topbar.openProfile}
            title={t.topbar.openProfile}
          >
            <Avatar initials={initials} />
            <span className="hidden min-w-0 text-left sm:block">
              <span className="block max-w-32 truncate text-sm font-black text-ink dark:text-white">{user?.name}</span>
              <span className="block text-xs font-semibold capitalize text-muted dark:text-white/50">{user?.role?.replace("_", " ")}</span>
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
