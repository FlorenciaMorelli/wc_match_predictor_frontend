// Generador (correr a mano): lee lib/data/squads_wc2026.csv y emite lib/shirt-names-data.ts
// con el mapa ISO2 → [[nombre_completo, nombre_camiseta], …] de la convocatoria WC2026.
// El nombre de camiseta (back-of-shirt) NO siempre coincide con el apellido parseado, por eso
// se usa el dato oficial del CSV. NO se parsea el CSV en runtime: este script lo pre-procesa.
//
//   node scripts/gen-shirt-names.mjs
//
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CSV = join(ROOT, "lib", "data", "squads_wc2026.csv");
const OUT = join(ROOT, "lib", "shirt-names-data.ts");

// FIFA 3-letras (columna `abreviatura`) → ISO2 (flagcdn, los flag_a/flag_b del backend).
const FIFA3_TO_ISO2 = {
  ALG: "dz",
  ARG: "ar",
  AUS: "au",
  AUT: "at",
  BEL: "be",
  BIH: "ba",
  BRA: "br",
  CPV: "cv",
  CAN: "ca",
  COL: "co",
  COD: "cd",
  CIV: "ci",
  CRO: "hr",
  CUW: "cw",
  CZE: "cz",
  ECU: "ec",
  EGY: "eg",
  ENG: "gb-eng",
  FRA: "fr",
  GER: "de",
  GHA: "gh",
  HAI: "ht",
  IRN: "ir",
  IRQ: "iq",
  JPN: "jp",
  JOR: "jo",
  KOR: "kr",
  MEX: "mx",
  MAR: "ma",
  NED: "nl",
  NZL: "nz",
  NOR: "no",
  PAN: "pa",
  PAR: "py",
  POR: "pt",
  QAT: "qa",
  KSA: "sa",
  SCO: "gb-sct",
  SEN: "sn",
  RSA: "za",
  ESP: "es",
  SWE: "se",
  SUI: "ch",
  TUN: "tn",
  TUR: "tr",
  URU: "uy",
  USA: "us",
  UZB: "uz",
};

const raw = readFileSync(CSV, "utf8").replace(/^﻿/, "");
const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
lines.shift(); // encabezado

const map = {}; // iso2 → [ [nombre_completo, nombre_camiseta], ... ]
let skipped = 0;
for (const line of lines) {
  const cols = line.split(",");
  if (cols.length < 8) {
    skipped++;
    continue;
  }
  const abreviatura = cols[1].trim();
  const nombreCompleto = cols[3].trim();
  const nombreCamiseta = cols[6].trim();
  const iso2 = FIFA3_TO_ISO2[abreviatura];
  if (!iso2 || !nombreCompleto || !nombreCamiseta) {
    skipped++;
    continue;
  }
  (map[iso2] ??= []).push([nombreCompleto, nombreCamiseta]);
}

const isos = Object.keys(map).sort();
const body = isos
  .map((iso) => {
    const rows = map[iso]
      .map(
        ([full, shirt]) =>
          `    [${JSON.stringify(full)}, ${JSON.stringify(shirt)}]`
      )
      .join(",\n");
    return `  ${JSON.stringify(iso)}: [\n${rows},\n  ],`;
  })
  .join("\n");

const out = `// GENERADO por scripts/gen-shirt-names.mjs desde lib/data/squads_wc2026.csv — NO editar a mano.
// ISO2 (flagcdn) → lista de [nombre_completo, nombre_camiseta] de la convocatoria WC2026.
// El resolver con match por tokens vive en lib/shirt-names.ts.
export const SHIRT_NAMES: Record<string, [string, string][]> = {
${body}
};
`;

writeFileSync(OUT, out, "utf8");
const total = isos.reduce((n, i) => n + map[i].length, 0);
console.log(
  `Escrito ${OUT}: ${isos.length} selecciones, ${total} jugadores (${skipped} filas omitidas).`
);
