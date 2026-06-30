import { describe, it, expect } from "vitest";
import { isKnockoutRound } from "./rounds";

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
