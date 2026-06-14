import { createContext, useContext } from "react";
import type { Translations } from "@/locales/types";
import { es } from "@/locales/es";
import { en } from "@/locales/en";

export type Locale = "es" | "en";
export type { Translations };

export const dictionaries: Record<Locale, Translations> = { es, en };

export type LanguageContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Translations;
};

export const LanguageContext = createContext<LanguageContextValue>({
  locale: "es",
  setLocale: () => {},
  t: es,
});

export function useLanguage(): LanguageContextValue {
  return useContext(LanguageContext);
}

// Nombre de equipo a mostrar según idioma: inglés usa el canónico (FIFA, p. ej.
// "Turkey"), español la variante traducida (p. ej. "Turquía"). Centraliza la
// elección para no esparcir checks de `locale` por los componentes.
export function teamName(en: string, es: string, locale: Locale): string {
  return locale === "en" ? en : es;
}
