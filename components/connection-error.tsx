"use client";

import { WifiOff, Coffee, Clock, ServerCrash, RotateCcw } from "lucide-react";
import type { ApiErrorKind } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";

// Tarjeta de error reusable, serena y localizada por causa. Misma tarjeta para los
// 4 sitios que consumen la API; el `kind` decide ícono + copy (sin códigos HTTP).
// `role="alert"` para accesibilidad. `onRetry` opcional: si está, muestra Reintentar.
const ICONS = {
  offline: WifiOff,
  waking: Coffee,
  slow: Clock,
  server: ServerCrash,
} as const;

export default function ConnectionError({
  kind,
  onRetry,
  detail,
  className,
}: {
  kind: ApiErrorKind;
  onRetry?: () => void;
  detail?: string;
  className?: string;
}) {
  const { t } = useLanguage();
  const Icon = ICONS[kind];
  const copy = t.errors[kind];

  return (
    <div
      role="alert"
      className={`flex flex-col items-center gap-3 rounded-xl bg-canvas px-6 py-8 text-center ${className ?? ""}`}
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-surface text-ink-muted shadow-sm">
        <Icon size={20} />
      </span>
      <div>
        <p className="font-display text-base font-bold text-ink">{copy.title}</p>
        <p className="mt-1 text-sm leading-6 text-ink-muted">{copy.body}</p>
        {kind === "server" && detail && (
          <p className="mt-1 text-xs text-ink-subtle">{detail}</p>
        )}
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-1 flex items-center gap-1.5 rounded-xl border border-line px-4 py-2 text-sm font-semibold text-ink-muted transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
        >
          <RotateCcw size={14} />
          {t.errors.retry}
        </button>
      )}
    </div>
  );
}
