"use client";

import { useEffect, useState } from "react";
import FlagImage from "./flag-image";
import { useLanguage } from "@/lib/i18n";

interface Props {
  flagA?: string;
  nameA?: string;
  flagB?: string;
  nameB?: string;
}

// Loader temático mientras corre el predict (puede tardar ~150s). Entretiene y,
// de paso, comunica los pasos reales del motor (Elo → fuerzas → 100k Monte Carlo).
// Reutilizable: el Predictor pasa la selección elegida; el fixture, los del partido.
export default function PredictLoader({ flagA, nameA, flagB, nameB }: Props) {
  const { t } = useLanguage();
  const steps = t.predictor.loadingSteps;
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setStep((s) => (s + 1) % steps.length);
    }, 2200);
    return () => clearInterval(id);
  }, [steps.length]);

  return (
    <div className="flex flex-col items-center gap-6 py-10 text-center">
      {(flagA || flagB) && (
        <div className="flex items-center gap-4">
          {flagA && (
            <FlagImage
              iso2={flagA}
              name={nameA ?? ""}
              size="md"
              className="shadow-sm"
            />
          )}
          <span className="animate-bounce text-2xl" aria-hidden>
            ⚽
          </span>
          {flagB && (
            <FlagImage
              iso2={flagB}
              name={nameB ?? ""}
              size="md"
              className="shadow-sm"
            />
          )}
        </div>
      )}

      <div className="min-h-[3rem]">
        <p className="text-ink text-sm font-semibold">
          {t.predictor.loadingTitle}
        </p>
        <p
          key={step}
          className="text-ink-muted animate-in fade-in mt-1 text-sm duration-500"
        >
          {steps[step]}
        </p>
      </div>

      <div className="flex items-center gap-1.5" aria-hidden>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="bg-brand h-2 w-2 animate-bounce rounded-full"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>

      <span className="sr-only" role="status">
        {t.predictor.loadingTitle}
      </span>
    </div>
  );
}
