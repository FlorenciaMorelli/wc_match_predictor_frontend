import { describe, it, expect } from "vitest";
import {
  resolveKits,
  designationFor,
  kitFor,
  colorFamily,
  DEFAULT_KIT,
} from "./kits";

describe("resolveKits — regla de contraste FIFA", () => {
  it("sin choque, ambos visten su titular", () => {
    // Argentina (celeste) vs Brasil (amarillo): no chocan.
    const { kitA, kitB } = resolveKits("ar", "br");
    expect(kitA.pattern).toBe("stripes"); // titular AR
    expect(colorFamily(kitB.primary)).not.toBe(colorFamily(kitA.primary));
  });

  it("con choque, el visitante cambia de camiseta", () => {
    // España (rojo) vs Turquía (rojo): chocan → B no puede quedar rojo.
    const { kitA, kitB } = resolveKits("es", "tr");
    expect(colorFamily(kitA.primary)).toBe("red");
    expect(colorFamily(kitB.primary)).not.toBe("red");
  });

  it("localSide='b' invierte quién es local", () => {
    const { kitA, kitB } = resolveKits("es", "tr", "b");
    // El local (B = Turquía) mantiene su titular rojo; A se cambia.
    expect(colorFamily(kitB.primary)).toBe("red");
    expect(colorFamily(kitA.primary)).not.toBe("red");
  });
});

describe("kitFor — fallback", () => {
  it("país sin datos → kit por defecto", () => {
    expect(kitFor("zz", "home")).toEqual(DEFAULT_KIT);
  });
});

describe("designationFor — designación oficial por partido", () => {
  it("cruce conocido resuelve kit (con patrón) + color de arquero", () => {
    const d = designationFor("ar", "dz");
    expect(d).not.toBeNull();
    // Argentina con su camiseta a rayas; sin dato de arquero → undefined (cae a dorado).
    expect(d!.a.kit.pattern).toBe("stripes");
    expect(d!.a.gk).toBeUndefined();
    // Argelia verde liso; arquero amarillo → hex.
    expect(d!.b.kit.pattern).toBe("solid");
    expect(d!.b.gk).toMatch(/^#/);
  });

  it("cruce sin designación → null (usa la regla de contraste)", () => {
    expect(designationFor("ar", "br")).toBeNull();
  });
});
