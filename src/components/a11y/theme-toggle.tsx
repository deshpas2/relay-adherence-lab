"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { usePrefs } from "./prefs-store";

const QUERY = "(prefers-color-scheme: dark)";

function subscribe(onChange: () => void) {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

/**
 * Light/dark switch with a smooth, slightly springy knob. The first tap saves
 * an explicit choice; "Match my device" stays available in the settings menu.
 * The page colors cross-fade briefly instead of snapping (skipped for less motion).
 */
export function ThemeToggle({ className }: { className?: string }) {
  const t = useTranslations("Settings");
  const theme = usePrefs((s) => s.prefs.theme);
  const update = usePrefs((s) => s.update);
  const systemDark = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
  const dark = theme === "dark" || (theme === "system" && systemDark);

  function toggle() {
    const root = document.documentElement;
    root.classList.add("theme-transition");
    update({ theme: dark ? "light" : "dark" });
    window.setTimeout(() => root.classList.remove("theme-transition"), 400);
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      aria-label={t("toggleTheme")}
      onClick={toggle}
      className={cn(
        "group relative inline-flex h-8 w-[3.75rem] shrink-0 items-center rounded-full border bg-secondary px-1 transition-colors duration-300 dark:bg-accent",
        className,
      )}
    >
      {/* faint track icons */}
      <Sun aria-hidden className="absolute left-2 size-3.5 text-muted-foreground opacity-60" />
      <Moon aria-hidden className="absolute right-2 size-3.5 text-muted-foreground opacity-60" />
      {/* the knob */}
      <span
        aria-hidden
        className={cn(
          "relative z-10 grid size-6 place-items-center rounded-full bg-primary text-primary-foreground",
          "transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
          dark ? "translate-x-7" : "translate-x-0",
        )}
      >
        <Sun
          className={cn(
            "absolute size-3.5 transition-all duration-500",
            dark ? "scale-50 -rotate-90 opacity-0" : "scale-100 rotate-0 opacity-100",
          )}
        />
        <Moon
          className={cn(
            "absolute size-3.5 transition-all duration-500",
            dark ? "scale-100 rotate-0 opacity-100" : "scale-50 rotate-90 opacity-0",
          )}
        />
      </span>
    </button>
  );
}
