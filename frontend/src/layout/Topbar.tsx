import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/useAuth";

export function Topbar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dark, setDark] = useState(() => localStorage.getItem("nurtureher_theme") === "dark");
  const initials = user?.name
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
    <header className="sticky top-0 z-20 border-b border-white/70 bg-background/78 px-4 py-3 backdrop-blur-2xl dark:border-white/10 dark:bg-[#1f1521]/78 md:px-8 md:py-4">
      <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-3 pl-14 lg:pl-0">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-bold text-muted dark:text-white/60 sm:text-sm">
            Welcome back, {user?.name ?? "there"}
          </p>
          <h2 className="truncate text-base font-black text-ink dark:text-white sm:text-xl">
            Your wellness dashboard is ready
          </h2>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="secondary"
            className="h-11 w-11 px-0"
            onClick={() => setDark((value) => !value)}
            aria-label={dark ? "Use light mode" : "Use dark mode"}
            title={dark ? "Use light mode" : "Use dark mode"}
          >
            {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          <button
            type="button"
            onClick={() => navigate("/profile")}
            className="flex min-h-11 items-center gap-2 rounded-2xl border border-pink-100 bg-white/90 px-1.5 py-1 shadow-card backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 dark:border-white/10 dark:bg-white/10 sm:pr-3"
            aria-label="Open profile"
            title="Open profile"
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
