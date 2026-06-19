"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

export type Model = "dixon_coles" | "bivariate_poisson" | "poisson_simple";

const MODEL_KEYS: { value: Model; recommended?: boolean }[] = [
  { value: "dixon_coles", recommended: true },
  { value: "bivariate_poisson" },
  { value: "poisson_simple" },
];

interface Props {
  value: Model;
  onChange: (model: Model) => void;
}

export default function ModelPicker({ value, onChange }: Props) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const selectedLabel = t.modelPicker[value].label;

  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="border-line bg-surface hover:border-brand/40 focus-visible:ring-brand flex w-full items-center gap-2 rounded-[10px] border px-3 py-1.5 text-left text-sm transition focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        <span className="text-ink-subtle shrink-0 text-xs font-semibold tracking-widest uppercase">
          {t.modelPicker.label}
        </span>
        <span className="text-ink font-medium">{selectedLabel}</span>
        <ChevronDown
          size={14}
          className={`text-ink-subtle ml-auto shrink-0 transition-transform duration-150 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="border-line bg-surface absolute z-20 mt-1 w-full min-w-[18rem] overflow-hidden rounded-[10px] border shadow-lg">
          <ul className="py-1">
            {MODEL_KEYS.map((m) => {
              const active = m.value === value;
              const model = t.modelPicker[m.value];
              return (
                <li key={m.value}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(m.value);
                      setOpen(false);
                    }}
                    className={`hover:bg-canvas flex w-full items-start gap-3 px-4 py-3 text-left transition-colors ${
                      active ? "bg-brand-soft" : ""
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-ink text-sm font-medium">
                          {model.label}
                        </span>
                        {m.recommended && (
                          <span className="bg-brand-soft text-brand rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase">
                            {t.modelPicker.recommended}
                          </span>
                        )}
                      </div>
                      <p className="text-ink-muted mt-0.5 text-xs leading-5">
                        {model.description}
                      </p>
                    </div>
                    {active && (
                      <Check size={15} className="text-brand mt-0.5 shrink-0" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
