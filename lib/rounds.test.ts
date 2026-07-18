import { describe, it, expect } from "vitest";
import { isKnockoutRound, canonicalRound } from "./rounds";

describe("isKnockoutRound", () => {
  it("fase de grupos → false", () => {
    expect(isKnockoutRound("group-stage")).toBe(false);
    expect(isKnockoutRound("GROUP-STAGE")).toBe(false);
    expect(isKnockoutRound("  group-stage  ")).toBe(false);
  });

  it("rondas de eliminatoria → true", () => {
    for (const r of [
      "round-of-32",
      "round-of-16",
      "quarter-finals",
      "semi-finals",
      "third-place",
      "final",
    ]) {
      expect(isKnockoutRound(r)).toBe(true);
    }
  });

  it("vacío / nulo / indefinido → false (modo regular seguro)", () => {
    expect(isKnockoutRound("")).toBe(false);
    expect(isKnockoutRound(null)).toBe(false);
    expect(isKnockoutRound(undefined)).toBe(false);
  });
});

describe("canonicalRound", () => {
  it("mapea los slugs sin guión del backend a la forma canónica", () => {
    expect(canonicalRound("quarterfinals")).toBe("quarter-finals");
    expect(canonicalRound("quarterfinal")).toBe("quarter-finals");
    expect(canonicalRound("semifinals")).toBe("semi-finals");
    expect(canonicalRound("semifinal")).toBe("semi-finals");
  });

  it("mapea las variantes de tercer puesto a la forma canónica", () => {
    expect(canonicalRound("3rd-place-match")).toBe("third-place");
    expect(canonicalRound("3rd-place")).toBe("third-place");
    expect(canonicalRound("third-place-match")).toBe("third-place");
    expect(canonicalRound("thirdplace")).toBe("third-place");
  });

  // Vocabulario real del backend, verificado contra `/api/fixture`. Cada slug
  // que manda tiene que caer en una ronda que el fixture sepa renderizar.
  it("canonicaliza el vocabulario real del backend", () => {
    const BACKEND_ROUNDS: Record<string, string> = {
      "group-stage": "group-stage",
      "round-of-32": "round-of-32",
      "round-of-16": "round-of-16",
      quarterfinals: "quarter-finals",
      semifinals: "semi-finals",
      "3rd-place-match": "third-place",
      final: "final",
    };
    for (const [backend, canonical] of Object.entries(BACKEND_ROUNDS)) {
      expect(canonicalRound(backend)).toBe(canonical);
    }
  });

  it("normaliza mayúsculas y espacios antes de mapear", () => {
    expect(canonicalRound("  QuarterFinals ")).toBe("quarter-finals");
  });

  it("deja pasar los slugs ya canónicos tal cual", () => {
    for (const r of [
      "group-stage",
      "round-of-32",
      "round-of-16",
      "quarter-finals",
      "semi-finals",
      "third-place",
      "final",
    ]) {
      expect(canonicalRound(r)).toBe(r);
    }
  });

  it("vacío / nulo / indefinido → cadena vacía", () => {
    expect(canonicalRound("")).toBe("");
    expect(canonicalRound(null)).toBe("");
    expect(canonicalRound(undefined)).toBe("");
  });
});
