"use client";

import { useSyncExternalStore } from "react";
import { Sun, Moon } from "lucide-react";
import {
  subscribeTheme,
  getThemeSnapshot,
  getThemeServerSnapshot,
  toggleTheme,
} from "@/lib/theme";
import { useLanguage } from "@/lib/i18n";

export default function ThemeToggle() {
  const { t } = useLanguage();
  const isDark = useSyncExternalStore(
    subscribeTheme,
    getThemeSnapshot,
    getThemeServerSnapshot
  );

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? t.theme.toLight : t.theme.toDark}
      className="text-ink-muted hover:bg-canvas hover:text-ink focus-visible:ring-brand rounded-full p-1.5 transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
    >
      <Sun size={16} className="hidden dark:block" />
      <Moon size={16} className="block dark:hidden" />
    </button>
  );
}
