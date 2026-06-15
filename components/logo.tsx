// Isologo: pelota de fútbol minimalista.
// Círculo brand (se adapta al dark mode vía CSS var) + 3 costuras blancas
// geométricas + anillo dorado. Funciona en nav, footer y cualquier superficie.
export default function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      {/* Cuerpo de la pelota — usa el color brand del tema (navy en light, azul en dark) */}
      <circle cx="16" cy="16" r="13.5" fill="var(--brand)" />

      {/* Costura horizontal: arco ecuatorial que sugiere esfera */}
      <path
        d="M 2.5,16 C 8,9.5 24,9.5 29.5,16"
        stroke="white"
        strokeWidth="1.4"
        strokeLinecap="round"
        fill="none"
        strokeOpacity="0.75"
      />

      {/* Costura meridional izquierda (curva S) */}
      <path
        d="M 16,2.5 C 9,8 9,24 16,29.5"
        stroke="white"
        strokeWidth="1.4"
        strokeLinecap="round"
        fill="none"
        strokeOpacity="0.75"
      />

      {/* Costura meridional derecha (curva S) */}
      <path
        d="M 16,2.5 C 23,8 23,24 16,29.5"
        stroke="white"
        strokeWidth="1.4"
        strokeLinecap="round"
        fill="none"
        strokeOpacity="0.75"
      />

      {/* Anillo dorado — define el contorno y aporta el acento WC */}
      <circle
        cx="16"
        cy="16"
        r="13.5"
        fill="none"
        stroke="var(--gold)"
        strokeWidth="1.5"
      />
    </svg>
  );
}
