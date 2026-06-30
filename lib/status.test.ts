import { describe, it, expect } from "vitest";
import { isLiveStatus, isFinishedStatus } from "./status";

describe("isLiveStatus", () => {
  it("estados en juego (regular + eliminatoria)", () => {
    for (const s of [
      "en juego",
      "descanso",
      "STATUS_FIRST_HALF",
      "STATUS_SECOND_HALF",
      "STATUS_HALFTIME",
      "STATUS_OVERTIME",
      "STATUS_END_OF_REGULATION",
      "STATUS_END_OF_EXTRATIME",
      "STATUS_SHOOTOUT",
    ]) {
      expect(isLiveStatus(s)).toBe(true);
    }
  });

  it("no-en-juego → false", () => {
    for (const s of ["programado", "finalizado", "STATUS_FINAL_PEN", ""]) {
      expect(isLiveStatus(s)).toBe(false);
    }
  });
});

describe("isFinishedStatus", () => {
  it("estados terminados (90' / alargue / penales)", () => {
    for (const s of [
      "finalizado",
      "STATUS_FULL_TIME",
      "STATUS_FINAL",
      "STATUS_FINAL_PEN",
      "STATUS_FINAL_AET",
    ]) {
      expect(isFinishedStatus(s)).toBe(true);
    }
  });

  it("cualquier variante STATUS_FINAL_* → true (red de seguridad)", () => {
    expect(isFinishedStatus("STATUS_FINAL_SOMETHING_NEW")).toBe(true);
  });

  it("en juego / programado → false", () => {
    for (const s of ["en juego", "STATUS_OVERTIME", "programado", ""]) {
      expect(isFinishedStatus(s)).toBe(false);
    }
  });
});
