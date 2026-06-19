"use client";

import { ArrowRight } from "lucide-react";
import Countdown from "./countdown";
import { useLanguage } from "@/lib/i18n";

export default function Hero() {
  const { t } = useLanguage();

  return (
    <section className="mx-auto flex max-w-7xl flex-col items-center px-6 py-12 text-center md:px-12 md:py-16 lg:py-20">
      <span className="border-line bg-surface text-ink-muted mb-4 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold tracking-widest uppercase shadow-sm">
        <span className="wc-tricolor h-2.5 w-2.5 rounded-full" />
        {t.hero.badge}
      </span>

      <h1 className="font-display text-ink max-w-2xl text-3xl leading-[1.1] font-extrabold tracking-tight sm:text-4xl md:text-5xl">
        {t.hero.heading1} <span className="text-brand">{t.hero.heading2}</span>
      </h1>

      <p className="text-ink-muted mt-4 max-w-xl text-sm leading-6 md:text-base">
        {t.hero.description}
      </p>

      <div className="mt-8">
        <Countdown />
      </div>

      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
        <a
          href="#predictor"
          className="bg-brand hover:bg-brand-hover focus-visible:ring-brand flex items-center gap-2 rounded-xl px-7 py-3.5 text-[15px] font-semibold text-white transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          {t.hero.ctaPredict}
          <ArrowRight size={16} />
        </a>
        <a
          href="#fixture"
          className="border-line bg-surface text-ink hover:bg-canvas focus-visible:ring-brand rounded-xl border px-7 py-3.5 text-[15px] font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          {t.hero.ctaFixture}
        </a>
      </div>
    </section>
  );
}
