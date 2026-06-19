import { describe, it, expect } from "vitest";
import { countryCode } from "./country-codes";

describe("countryCode", () => {
  it("resuelve el nombre canónico del CSV", () => {
    expect(countryCode("Argentina")).toBe("ARG");
    expect(countryCode("Cabo Verde")).toBe("CPV");
  });

  it("resuelve variantes del backend vía alias", () => {
    expect(countryCode("South Korea")).toBe("KOR");
    expect(countryCode("Czech Republic")).toBe("CZE");
    expect(countryCode("United States")).toBe("USA");
  });

  it("es robusto a acentos y mayúsculas", () => {
    expect(countryCode("ARGENTINA")).toBe("ARG");
  });

  it("desconocido → cadena vacía (fallback seguro)", () => {
    expect(countryCode("Atlantis")).toBe("");
  });
});
