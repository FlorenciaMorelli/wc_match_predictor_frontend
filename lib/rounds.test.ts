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
    expect(canonicalRound("thirdplace")).toBe("third-place");
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
