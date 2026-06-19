"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { FixtureMatch } from "@/types";
import type { ModelKey } from "@/locales/types";
import {
  fetchFixture,
  predictMatch,
  toApiError,
  type ApiError,
} from "@/lib/api";
import { summarize, type MatchEval } from "@/lib/model-eval";
import { useLanguage } from "@/lib/i18n";
import Logo from "@/components/logo";
import LanguageToggle from "@/components/language-toggle";
import ThemeToggle from "@/components/theme-toggle";
import ConnectionError from "@/components/connection-error";

const MODELS: ModelKey[] = [
  "dixon_coles",
  "bivariate_poisson",
  "poisson_simple",
];

// Estados de partido finalizado (mismas variantes que tolera prediction-result).
const FINISHED = new Set<string>(["finalizado", "STATUS_FULL_TIME"]);

// Cuántos predicts en paralelo. Bajo para no saturar el backend (Render) ni el navegador.
const CONCURRENCY = 4;

// Caché por (modelo, partido, marcador) en localStorage: un partido finalizado y su
// predicción no cambian, así que no se recalcula entre visitas ni al cambiar de modelo.
const CACHE_PREFIX = "wc-eval:v1:";

function cacheKey(model: ModelKey, m: FixtureMatch): string {
  return `${CACHE_PREFIX}${model}:${m.id}:${m.score_a}-${m.score_b}`;
}

function readCache(key: string): MatchEval | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as MatchEval) : null;
  } catch {
    return null;
  }
}

function writeCache(key: string, value: MatchEval): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage lleno o deshabilitado: seguimos sin cachear.
  }
}

function isIntScore(s: string): boolean {
  return Number.isInteger(Number.parseInt(s, 10));
}

// Evalúa un partido: cache → predict → MatchEval. Falla individual → null (se omite).
async function evalOne(
  m: FixtureMatch,
  model: ModelKey
): Promise<MatchEval | null> {
  const key = cacheKey(model, m);
  const cached = readCache(key);
  if (cached) return cached;
  try {
    const res = await predictMatch({
      team_a_id: m.team_a_id,
      team_b_id: m.team_b_id,
      date: m.date,
      knockout: false,
      model,
    });
    const top = res.top_scorelines?.[0];
    const ev: MatchEval = {
      id: m.id,
      pA: res.p_a,
      pDraw: res.p_draw,
      pB: res.p_b,
      predA: top ? top.score_a : -1,
      predB: top ? top.score_b : -1,
      actualA: Number.parseInt(m.score_a, 10),
      actualB: Number.parseInt(m.score_b, 10),
    };
    writeCache(key, ev);
    return ev;
  } catch {
    return null;
  }
}

function pct(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export default function EvalPage() {
  const { t } = useLanguage();
  const [model, setModel] = useState<ModelKey>("dixon_coles");
  const [status, setStatus] = useState<"loading" | "done" | "error">("loading");
  const [done, setDone] = useState(0);
  const [total, setTotal] = useState(0);
  const [evals, setEvals] = useState<MatchEval[]>([]);
  const [error, setError] = useState<ApiError | null>(null);
  // Identifica la corrida vigente: si el usuario cambia de modelo a mitad, las
  // resoluciones de la corrida anterior se descartan (no pisan el estado).
  const runIdRef = useRef(0);

  // setState SOLO dentro de callbacks de promesa (nunca sincrónico en el efecto), para
  // no disparar react-hooks/set-state-in-effect. El reset al cambiar de modelo va en el
  // handler de click (evento), no acá.
  const run = useCallback(() => {
    const runId = ++runIdRef.current;
    fetchFixture()
      .then(async (fixture) => {
        if (runId !== runIdRef.current) return;
        const finished = fixture.filter(
          (m) =>
            FINISHED.has(m.status) &&
            isIntScore(m.score_a) &&
            isIntScore(m.score_b)
        );
        setTotal(finished.length);
        if (finished.length === 0) {
          setEvals([]);
          setStatus("done");
          return;
        }
        const out: MatchEval[] = [];
        let idx = 0;
        const worker = async () => {
          while (true) {
            const i = idx++;
            if (i >= finished.length) break;
            const ev = await evalOne(finished[i], model);
            if (runId !== runIdRef.current) return;
            if (ev) out.push(ev);
            setDone((d) => d + 1);
          }
        };
        await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
        if (runId !== runIdRef.current) return;
        setEvals(out);
        setStatus("done");
      })
      .catch((e) => {
        if (runId !== runIdRef.current) return;
        setError(toApiError(e));
        setStatus("error");
      });
  }, [model]);

  useEffect(() => {
    run();
  }, [run]);

  function selectModel(m: ModelKey) {
    if (m === model) return;
    setModel(m);
    setStatus("loading");
    setDone(0);
    setTotal(0);
    setEvals([]);
    setError(null);
  }

  function retry() {
    setStatus("loading");
    setDone(0);
    setTotal(0);
    setEvals([]);
    setError(null);
    run();
  }

  const summary = useMemo(() => summarize(evals), [evals]);
  const calRows = summary.calibration.filter((b) => b.n > 0);

  return (
    <div className="bg-canvas text-ink min-h-screen">
      <header className="border-line bg-surface border-b">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4 md:px-10">
          <Link
            href="/"
            className="text-ink-muted hover:text-ink flex items-center gap-1.5 text-sm font-medium transition-colors"
          >
            <ArrowLeft size={16} />
            {t.eval.back}
          </Link>
          <div className="flex items-center gap-4">
            <LanguageToggle />
            <ThemeToggle />
            <Logo size={20} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12 md:px-10">
        <h1 className="font-display text-3xl font-extrabold tracking-tight md:text-4xl">
          {t.eval.title}
        </h1>
        <p className="text-ink-muted mt-2 max-w-2xl text-sm leading-6">
          {t.eval.subtitle}
        </p>

        {/* ¿Cómo funciona? — explicación del modelo en lenguaje claro */}
        <section className="mt-10">
          <h2 className="font-display text-lg font-bold">{t.eval.how.title}</h2>
          <p className="text-ink-muted mt-1 max-w-2xl text-sm leading-6">
            {t.eval.how.intro}
          </p>
          <ol className="mt-4 space-y-2.5">
            {t.eval.how.steps.map((step, i) => (
              <li key={i} className="text-ink flex gap-3 text-sm leading-6">
                <span className="bg-brand-soft text-brand flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
          <p className="text-ink-muted mt-5 text-sm">{t.eval.how.models}</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {MODELS.map((m) => (
              <div
                key={m}
                className="border-line bg-surface rounded-xl border px-4 py-3"
              >
                <p className="text-ink text-sm font-semibold">
                  {t.modelPicker[m].label}
                </p>
                <p className="text-ink-muted mt-1 text-xs leading-5">
                  {t.modelPicker[m].description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Qué tan acertado fue — métricas + calibración (por modelo) */}
        <section className="mt-12">
          <h2 className="font-display text-lg font-bold">
            {t.eval.metricsTitle}
          </h2>

          {/* Selector de modelo */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-ink-subtle text-xs font-semibold tracking-widest uppercase">
              {t.eval.modelLabel}
            </span>
            {MODELS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => selectModel(m)}
                aria-pressed={m === model}
                className={`focus-visible:ring-brand rounded-lg px-3 py-1.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none ${
                  m === model
                    ? "bg-brand text-white"
                    : "border-line text-ink-muted hover:bg-surface border"
                }`}
              >
                {t.modelPicker[m].label}
              </button>
            ))}
          </div>

          {status === "error" && error && (
            <ConnectionError
              kind={error.kind}
              detail={error.detail}
              onRetry={retry}
              className="mt-8"
            />
          )}

          {status === "loading" && (
            <div className="mt-8">
              <div className="text-ink-muted mb-2 flex items-center justify-between text-sm">
                <span>{t.eval.computing(done, total)}</span>
                {total > 0 && (
                  <span className="tabular-nums">
                    {Math.round((done / total) * 100)}%
                  </span>
                )}
              </div>
              <div className="bg-line h-2 w-full overflow-hidden rounded-full">
                <div
                  className="bg-brand h-2 rounded-full transition-[width] duration-300"
                  style={{
                    width: total > 0 ? `${(done / total) * 100}%` : "15%",
                  }}
                />
              </div>
            </div>
          )}

          {status === "done" && summary.n === 0 && (
            <p className="bg-surface text-ink-muted mt-8 rounded-xl px-5 py-8 text-center text-sm">
              {t.eval.empty}
            </p>
          )}

          {status === "done" && summary.n > 0 && (
            <>
              {/* Tarjetas de métricas */}
              <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
                {[
                  {
                    label: t.eval.metrics.winner,
                    value: pct(summary.winnerAccuracy),
                    help: t.eval.metrics.winnerHelp,
                  },
                  {
                    label: t.eval.metrics.brier,
                    value: summary.brier.toFixed(3),
                    help: t.eval.metrics.brierHelp,
                  },
                  {
                    label: t.eval.metrics.exact,
                    value: pct(summary.exactScoreRate),
                    help: t.eval.metrics.exactHelp,
                  },
                  {
                    label: t.eval.metrics.matches,
                    value: String(summary.n),
                    help: t.eval.metrics.matchesHelp,
                  },
                ].map((c) => (
                  <div
                    key={c.label}
                    className="border-line bg-surface rounded-xl border px-4 py-4"
                  >
                    <p className="text-ink-subtle text-xs font-semibold tracking-widest uppercase">
                      {c.label}
                    </p>
                    <p className="text-ink mt-1 font-mono text-2xl font-bold">
                      {c.value}
                    </p>
                    <p className="text-ink-muted mt-1 text-xs leading-5">
                      {c.help}
                    </p>
                  </div>
                ))}
              </div>

              {/* Calibración: explicación llana + barras comparables predicho vs observado */}
              <div className="mt-10">
                <h3 className="font-display text-base font-bold">
                  {t.eval.calibrationTitle}
                </h3>
                <p className="text-ink-muted mt-1 max-w-2xl text-sm leading-6">
                  {t.eval.calibrationIntro}
                </p>
                <p className="text-ink-muted mt-2 max-w-2xl text-sm leading-6">
                  {t.eval.calibrationExample}
                </p>

                {/* Leyenda */}
                <div className="text-ink-muted mt-4 flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1.5">
                    <span className="bg-line h-2.5 w-2.5 rounded-sm" />
                    {t.eval.calPredicted}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="bg-brand h-2.5 w-2.5 rounded-sm" />
                    {t.eval.calObserved}
                  </span>
                </div>

                <div className="mt-3 space-y-2.5">
                  {calRows.map((b) => (
                    <div key={b.lo} className="flex items-center gap-3">
                      <span className="text-ink-subtle w-16 shrink-0 text-xs tabular-nums">
                        {Math.round(b.lo * 100)}–{Math.round(b.hi * 100)}%
                      </span>
                      <div className="flex-1 space-y-1">
                        {/* Predicho */}
                        <div className="flex items-center gap-2">
                          <div className="bg-canvas h-2 flex-1 overflow-hidden rounded-full">
                            <div
                              className="bg-line h-2 rounded-full"
                              style={{
                                width: `${Math.min(100, b.predMean * 100)}%`,
                              }}
                            />
                          </div>
                          <span className="text-ink-muted w-12 shrink-0 text-right text-xs tabular-nums">
                            {pct(b.predMean)}
                          </span>
                        </div>
                        {/* Observado */}
                        <div className="flex items-center gap-2">
                          <div className="bg-canvas h-2 flex-1 overflow-hidden rounded-full">
                            <div
                              className="bg-brand h-2 rounded-full"
                              style={{
                                width: `${Math.min(100, b.obsRate * 100)}%`,
                              }}
                            />
                          </div>
                          <span className="text-ink w-12 shrink-0 text-right text-xs font-semibold tabular-nums">
                            {pct(b.obsRate)}
                          </span>
                        </div>
                      </div>
                      <span className="text-ink-subtle w-14 shrink-0 text-right text-xs tabular-nums">
                        {b.n} {t.eval.calMatches.toLowerCase()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-ink-subtle mt-6 text-xs leading-5">
                {t.eval.note}
              </p>
            </>
          )}
        </section>

        {/* Límites y uso responsable (Legal + UX): siempre visible */}
        <section
          role="note"
          className="mt-12 rounded-xl border border-amber-300/60 bg-amber-50 px-5 py-4 dark:border-amber-500/30 dark:bg-amber-900/20"
        >
          <h2 className="font-display text-sm font-bold text-amber-800 dark:text-amber-300">
            {t.eval.limits.title}
          </h2>
          <p className="mt-1.5 text-sm leading-6 text-amber-800/90 dark:text-amber-200/80">
            {t.eval.limits.body}
          </p>
        </section>
      </main>
    </div>
  );
}
