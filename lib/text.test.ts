import { describe, it, expect } from "vitest";
import { normalize, significantTokens } from "./text";

describe("normalize", () => {
  it("saca acentos y pasa a minúsculas", () => {
    expect(normalize("MARTÍNEZ")).toBe("martinez");
    expect(normalize("Côte d'Ivoire")).toBe("cote d ivoire");
  });

  it("unifica guiones, puntos y espacios", () => {
    expect(normalize("AIT-NOURI  Rayan")).toBe("ait nouri rayan");
    expect(normalize("VINI JR.")).toBe("vini jr");
  });
});

describe("significantTokens", () => {
  it("descarta tokens cortos (<4) y partículas", () => {
    // "van"/"der" son partículas; "ait"/"jr" son cortos.
    expect(significantTokens("van der Berg")).toEqual(["berg"]);
    expect(significantTokens("AIT-NOURI Rayan")).toEqual(["nouri", "rayan"]);
  });

  it("conserva los tokens significativos del nombre", () => {
    expect(significantTokens("VINICIUS JUNIOR")).toEqual([
      "vinicius",
      "junior",
    ]);
    expect(significantTokens("MASTIL Melvin")).toEqual(["mastil", "melvin"]);
  });

  it("nombre sin tokens significativos → []", () => {
    expect(significantTokens("J. O.")).toEqual([]);
  });
});
