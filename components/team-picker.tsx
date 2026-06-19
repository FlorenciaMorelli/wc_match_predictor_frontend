"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, X } from "lucide-react";
import type { Team } from "@/types";
import FlagImage from "./flag-image";
import { useLanguage, teamName } from "@/lib/i18n";

interface Props {
  teams: Team[];
  value: Team | null;
  onChange: (team: Team | null) => void;
  placeholder?: string;
  disabled?: boolean;
}

export default function TeamPicker({
  teams,
  value,
  onChange,
  placeholder,
  disabled,
}: Props) {
  const { t, locale } = useLanguage();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const resolvedPlaceholder = placeholder ?? t.teamPicker.placeholder;

  // Busca en ambos idiomas: el usuario puede tipear "Turkey" o "Turquía".
  const filtered = query.trim()
    ? teams.filter((team) => {
        const q = query.toLowerCase();
        return (
          team.name_es.toLowerCase().includes(q) ||
          team.canonical.toLowerCase().includes(q)
        );
      })
    : teams;

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className="border-line bg-surface hover:border-brand/40 focus-visible:ring-brand flex w-full items-center gap-3 rounded-[10px] border px-4 py-3.5 text-left text-sm transition focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
      >
        {value ? (
          <>
            <FlagImage
              iso2={value.flag}
              name={teamName(value.canonical, value.name_es, locale)}
              size="xs"
            />
            <span className="text-ink font-medium">
              {teamName(value.canonical, value.name_es, locale)}
            </span>
          </>
        ) : (
          <span className="text-ink-subtle">{resolvedPlaceholder}</span>
        )}
        <ChevronDown
          size={14}
          className={`text-ink-subtle ml-auto shrink-0 transition-transform duration-150 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="border-line bg-surface absolute z-20 mt-1 w-full overflow-hidden rounded-[10px] border shadow-lg">
          <div className="border-line border-b px-3 py-2.5">
            <div className="flex items-center gap-2">
              <Search size={13} className="text-ink-subtle shrink-0" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t.teamPicker.search}
                className="text-ink placeholder:text-ink-subtle flex-1 bg-transparent text-sm outline-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="text-ink-subtle hover:text-ink"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          <ul className="max-h-56 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="text-ink-subtle px-4 py-3 text-sm">
                {t.teamPicker.noResults}
              </li>
            ) : (
              filtered.map((team) => (
                <li key={team.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(team);
                      setOpen(false);
                      setQuery("");
                    }}
                    className={`text-ink hover:bg-canvas flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                      value?.id === team.id ? "bg-brand-soft font-medium" : ""
                    }`}
                  >
                    <FlagImage
                      iso2={team.flag}
                      name={teamName(team.canonical, team.name_es, locale)}
                      size="xs"
                    />
                    {teamName(team.canonical, team.name_es, locale)}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
