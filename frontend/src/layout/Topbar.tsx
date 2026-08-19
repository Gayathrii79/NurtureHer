import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Bell, CalendarCheck, ChevronDown, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { SearchBar } from "@/components/common/SearchBar";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LanguageSelect } from "@/components/ui/select";

export function Topbar() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <header className="sticky top-0 z-20 border-b border-white/70 bg-background/78 px-4 py-3 backdrop-blur-2xl dark:border-white/10 dark:bg-[#1f1521]/78 md:px-8 md:py-4">
      <div className="flex items-center justify-between gap-4">
        <div className="hidden min-w-0 md:block">
          <p className="text-sm font-bold text-muted dark:text-white/60">Good morning, Aditi</p>
          <h2 className="truncate text-xl font-black text-ink dark:text-white">Your wellness dashboard is ready</h2>
        </div>
        <div className="ml-12 flex flex-1 items-center gap-3 md:ml-0 md:max-w-xl">
          <SearchBar placeholder="Search health records, guides, alerts..." />
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 rounded-2xl border border-pink-100 bg-white/75 px-3 py-2 text-sm font-bold text-ink shadow-sm dark:border-white/10 dark:bg-white/10 dark:text-white xl:flex">
            <CalendarCheck className="h-4 w-4 text-primary" />
            Jul 9
          </div>
          <div className="hidden sm:block">
            <LanguageSelect />
          </div>
          <Button variant="secondary" className="h-11 w-11 px-0" aria-label="Notifications">
            <Bell className="h-5 w-5" />
          </Button>
          <Button variant="secondary" className="h-11 w-11 px-0" onClick={() => setDark((value) => !value)} aria-label="Toggle dark mode">
            {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button className="hidden items-center gap-2 rounded-2xl bg-white/90 px-2 py-1 shadow-card backdrop-blur-xl transition hover:-translate-y-0.5 dark:bg-white/10 sm:flex" aria-label="Open profile menu">
                <Avatar />
                <ChevronDown className="h-4 w-4 text-muted" />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content align="end" sideOffset={10} className="z-50 w-56 overflow-hidden rounded-[22px] border border-pink-100 bg-white/95 p-2 shadow-card backdrop-blur-2xl dark:border-white/10 dark:bg-[#2a1d2f]/95">
                {["Profile", "Care preferences", "Settings"].map((item) => (
                  <DropdownMenu.Item key={item} className="cursor-pointer rounded-2xl px-3 py-2 text-sm font-bold text-ink outline-none transition hover:bg-pink-50 dark:text-white dark:hover:bg-white/10">
                    {item}
                  </DropdownMenu.Item>
                ))}
                <DropdownMenu.Separator className="my-1 h-px bg-pink-100 dark:bg-white/10" />
                <DropdownMenu.Item className="cursor-pointer rounded-2xl px-3 py-2 text-sm font-bold text-primary outline-none transition hover:bg-pink-50 dark:hover:bg-white/10">
                  Sign out
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </div>
    </header>
  );
}
