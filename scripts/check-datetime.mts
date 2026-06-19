// Verificación manual de la conversión de horarios (lib/datetime.ts) bajo
// distintas zonas horarias, sin navegador. Corre el módulo REAL.
//
// Uso (PowerShell), una zona:
//   $env:TZ='Asia/Tokyo'; node scripts/check-datetime.mts
//
// Matriz de zonas de una sola pasada:
//   foreach ($tz in 'America/Argentina/Buenos_Aires','Europe/Berlin','Asia/Tokyo','America/Los_Angeles') {
//     $env:TZ=$tz; node scripts/check-datetime.mts
//   }
//
// Qué mirar: el partido de las 00:30 UTC debe "cambiar de día" según la zona
// (cae el día anterior al oeste de UTC), y el de time_utc="19" (hora suelta del
// backend) debe convertirse igual que "19:00".

import {
  formatLocalTime,
  localDateString,
  localTimeZoneName,
  normalizeUtcTime,
} from "../lib/datetime.ts";

const LOCALE = "es-AR";

// Casos representativos (date + time_utc tal como los manda el backend).
const matches = [
  {
    date: "2026-06-12",
    time_utc: "19",
    label: "Canadá vs Bosnia (hora suelta)",
  },
  {
    date: "2026-06-13",
    time_utc: "01",
    label: "USA vs Paraguay (madrugada UTC)",
  },
  {
    date: "2026-06-20",
    time_utc: "00:30",
    label: "Brazil vs Haiti (cruza medianoche)",
  },
  {
    date: "2026-06-15",
    time_utc: "",
    label: "Sin hora (debe quedar en blanco)",
  },
];

const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
console.log(`\n=== Zona del proceso: ${tz} ===`);

for (const m of matches) {
  const norm = normalizeUtcTime(m.time_utc);
  const localTime = formatLocalTime(m.date, m.time_utc, LOCALE) || "(sin hora)";
  const localDay = localDateString(m.date, m.time_utc);
  const moved = localDay !== m.date ? "  ⟵ cambió de día" : "";
  console.log(
    `\n  ${m.label}` +
      `\n    API:        date=${m.date} time_utc=${JSON.stringify(m.time_utc)} -> normalizado=${JSON.stringify(norm)}` +
      `\n    Local:      ${localTime} ${localTimeZoneName(m.date, LOCALE, m.time_utc)}` +
      `\n    Día local:  ${localDay}${moved}`
  );
}

// Demostración del agrupamiento + orden por kickoff dentro del día local.
const grouped: Record<string, string[]> = {};
for (const m of matches) {
  if (!normalizeUtcTime(m.time_utc)) continue;
  const key = localDateString(m.date, m.time_utc);
  (grouped[key] ??= []).push(
    `${formatLocalTime(m.date, m.time_utc, LOCALE)}  ${m.label}`
  );
}
console.log("\n  --- Agrupado por día local ---");
for (const day of Object.keys(grouped).sort()) {
  console.log(`  ${day}`);
  for (const line of grouped[day].sort()) console.log(`     ${line}`);
}
console.log();
