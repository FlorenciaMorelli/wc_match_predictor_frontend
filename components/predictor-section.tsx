"use client";

import { useState, useEffect, useCallback } from "react";
import { RotateCcw, Calendar } from "lucide-react";
import type { Team, PredictResponse } from "@/types";
import TeamPicker from "./team-picker";
import ModelPicker, { type Model } from "./model-picker";
import PredictionResult from "./prediction-result";
import PredictLoader from "./predict-loader";
import ConnectionError from "./connection-error";
import { fetchTeams, predictMatch, toApiError, type ApiError } from "@/lib/api";
import { useLanguage, teamName } from "@/lib/i18n";

export default function PredictorSection() {
  const { t, locale } = useLanguage();
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamsError, setTeamsError] = useState<ApiError | null>(null);
  const [teamA, setTeamA] = useState<Team | null>(null);
  const [teamB, setTeamB] = useState<Team | null>(null);
  const [knockout, setKnockout] = useState(false);
  const [model, setModel] = useState<Model>("dixon_coles");
  const [matchDate, setMatchDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [result, setResult] = useState<PredictResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  // setState solo en los callbacks (no sincrónico): así el efecto que lo invoca no
  // dispara el lint react-hooks/set-state-in-effect. Éxito limpia el error.
  const loadTeams = useCallback(() => {
    fetchTeams()
      .then((ts) => {
        setTeams(ts);
        setTeamsError(null);
      })
      .catch((e) => setTeamsError(toApiError(e)));
  }, []);

  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

  async function handlePredict() {
    if (!teamA || !teamB || teamA.id === teamB.id) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await predictMatch({
        team_a_id: teamA.id,
        team_b_id: teamB.id,
        date: matchDate,
        knockout,
        model,
      });
      setResult(res);
      setTimeout(() => {
        document
          .getElementById("predictor-result")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 80);
    } catch (e) {
      setError(toApiError(e));
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setTeamA(null);
    setTeamB(null);
    setResult(null);
    setError(null);
  }

  const sameTeam = !!teamA && !!teamB && teamA.id === teamB.id;

  return (
    <section id="predictor" className="border-line bg-surface border-t">
      <div className="mx-auto max-w-7xl px-6 py-20 md:px-12">
        <div className="mx-auto max-w-2xl">
          <div className="text-center">
            <p className="text-ink-subtle mb-1 text-xs font-semibold tracking-widest uppercase">
              {t.predictor.sectionLabel}
            </p>
            <h2 className="font-display text-ink text-3xl font-extrabold tracking-tight md:text-4xl">
              {t.predictor.heading}
            </h2>
            <p className="text-ink-muted mt-2 text-sm leading-6">
              {t.predictor.description}
            </p>
          </div>

          {teamsError && (
            <ConnectionError
              kind={teamsError.kind}
              detail={teamsError.detail}
              onRetry={loadTeams}
              className="mt-4"
            />
          )}

          <div className="mt-8 flex items-end gap-3">
            <div className="flex-1">
              <label className="text-ink-subtle mb-2 block text-xs font-semibold tracking-widest uppercase">
                {t.predictor.teamALabel}
              </label>
              <TeamPicker
                teams={teams}
                value={teamA}
                onChange={setTeamA}
                placeholder={t.predictor.placeholderA}
                disabled={teams.length === 0 && !teamsError}
              />
            </div>
            <span className="text-ink-subtle mb-4 shrink-0 text-sm font-semibold">
              {t.fixture.vs}
            </span>
            <div className="flex-1">
              <label className="text-ink-subtle mb-2 block text-xs font-semibold tracking-widest uppercase">
                {t.predictor.teamBLabel}
              </label>
              <TeamPicker
                teams={teams}
                value={teamB}
                onChange={setTeamB}
                placeholder={t.predictor.placeholderB}
                disabled={teams.length === 0 && !teamsError}
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
            <label className="border-line bg-surface text-ink focus-within:ring-brand flex items-center gap-2 rounded-[10px] border px-3 py-1.5 text-sm focus-within:ring-2 focus-within:ring-offset-2">
              <Calendar size={14} className="text-ink-subtle shrink-0" />
              <input
                type="date"
                value={matchDate}
                onChange={(e) => setMatchDate(e.target.value)}
                aria-label={t.predictor.dateAriaLabel}
                className="text-ink bg-transparent text-sm outline-none"
              />
            </label>

            <label className="flex cursor-pointer items-center gap-2.5">
              <button
                type="button"
                role="switch"
                aria-checked={knockout}
                onClick={() => setKnockout((v) => !v)}
                className={`focus-visible:ring-brand relative h-5 w-9 rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none ${
                  knockout ? "bg-brand" : "bg-line"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-[left] duration-150 ${
                    knockout ? "left-[18px]" : "left-0.5"
                  }`}
                />
              </button>
              <span className="text-ink-muted text-sm">
                {t.predictor.knockout}
              </span>
            </label>

            <div className="w-full sm:w-auto">
              <ModelPicker value={model} onChange={setModel} />
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <button
              type="button"
              onClick={handlePredict}
              disabled={!teamA || !teamB || sameTeam || loading}
              className="bg-brand hover:bg-brand-hover focus-visible:ring-brand flex flex-1 items-center justify-center gap-2 rounded-xl px-7 py-3.5 text-[15px] font-semibold text-white transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  {t.predictor.calculating}
                </>
              ) : (
                t.predictor.predict
              )}
            </button>

            {(result || error) && (
              <button
                type="button"
                onClick={reset}
                className="border-line text-ink-muted hover:bg-canvas focus-visible:ring-brand flex items-center gap-1.5 rounded-xl border px-4 py-3.5 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                <RotateCcw size={13} />
                {t.predictor.clear}
              </button>
            )}
          </div>

          {sameTeam && (
            <p className="bg-canvas text-ink-muted mt-4 rounded-xl px-4 py-3 text-sm">
              {t.predictor.sameTeam}
            </p>
          )}

          {error && (
            <ConnectionError
              kind={error.kind}
              detail={error.detail}
              onRetry={handlePredict}
              className="mt-4"
            />
          )}
        </div>

        {loading && (
          <div className="mx-auto mt-2 max-w-2xl">
            <div className="border-line bg-surface rounded-2xl border p-8">
              <PredictLoader
                flagA={teamA?.flag}
                nameA={
                  teamA
                    ? teamName(teamA.canonical, teamA.name_es, locale)
                    : undefined
                }
                flagB={teamB?.flag}
                nameB={
                  teamB
                    ? teamName(teamB.canonical, teamB.name_es, locale)
                    : undefined
                }
              />
            </div>
          </div>
        )}

        {result && !loading && (
          <div
            id="predictor-result"
            className="mx-auto mt-2 max-w-2xl scroll-mt-20"
          >
            <div className="border-line bg-surface rounded-2xl border p-8">
              <PredictionResult result={result} />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
