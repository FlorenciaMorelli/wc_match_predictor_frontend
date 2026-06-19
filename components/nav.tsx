"use client";

import Link from "next/link";
import ThemeToggle from "./theme-toggle";
import LanguageToggle from "./language-toggle";
import { useLanguage } from "@/lib/i18n";
import Logo from "./logo";

export default function Nav() {
  const { t } = useLanguage();

  return (
    <header className="border-line bg-surface sticky top-0 z-30 border-b">
      <div className="wc-tricolor h-1 w-full" />
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 md:px-12">
        <Link
          href="/"
          className="font-display text-brand focus-visible:ring-brand flex items-center gap-2.5 rounded-sm text-xl font-extrabold tracking-tight focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          aria-label={t.nav.title}
        >
          <Logo size={28} />
          <span>{t.nav.title}</span>
        </Link>
        <nav className="flex items-center gap-4">
          <a
            href="#predictor"
            className="text-ink-muted hover:text-ink text-sm font-medium transition-colors"
          >
            {t.nav.predict}
          </a>
          <a
            href="#fixture"
            className="text-ink-muted hover:text-ink text-sm font-medium transition-colors"
          >
            {t.nav.fixture}
          </a>
          <LanguageToggle />
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
