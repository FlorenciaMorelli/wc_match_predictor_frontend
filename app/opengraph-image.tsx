import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Colores hardcodeados (ImageResponse no tiene acceso a CSS vars del tema).
const NAVY = "#183a70";
const GOLD = "#c9a84c";
const WHITE = "#ffffff";
const DARK_BG = "#0e1e3d";
const MUTED = "#8fa3c0";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: DARK_BG,
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Franja dorada superior */}
        <div style={{ height: 6, background: GOLD }} />

        {/* Contenido central */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 72,
            padding: "0 96px",
          }}
        >
          {/* Isologo: pelota minimalista con anillo dorado */}
          <div
            style={{
              width: 160,
              height: 160,
              borderRadius: "50%",
              background: NAVY,
              border: `5px solid ${GOLD}`,
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* ⚽ Las costuras SVG no son renderizables en ImageResponse.
                Se representa con una pelota sólida + ring, igualmente limpio. */}
          </div>

          {/* Texto */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <span
              style={{
                fontSize: 22,
                fontWeight: 600,
                color: GOLD,
                letterSpacing: "3px",
                textTransform: "uppercase",
              }}
            >
              Mundial FIFA 2026
            </span>
            <span
              style={{
                fontSize: 64,
                fontWeight: 800,
                color: WHITE,
                lineHeight: 1.1,
                letterSpacing: "-1px",
              }}
            >
              Predictor del{"\n"}Mundial 2026
            </span>
            <span
              style={{
                fontSize: 26,
                color: MUTED,
                lineHeight: 1.5,
                marginTop: 8,
              }}
            >
              Probabilidades estadísticas · Formaciones · Análisis
            </span>
          </div>
        </div>

        {/* Franja dorada inferior */}
        <div style={{ height: 6, background: GOLD }} />
      </div>
    ),
    { ...size }
  );
}
