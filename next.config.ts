import type { NextConfig } from "next";

// El navegador llama a "/api/*" en el mismo origen y Next reenvía esas requests
// al backend (server-side). Evita CORS y mantiene la URL del backend fuera del
// bundle del cliente. Configurable con API_BASE_URL (server-side, sin exponer).
const API_BASE_URL = (
  process.env.API_BASE_URL ?? "https://wc-match-predictor.onrender.com"
).replace(/\/+$/, "");

const nextConfig: NextConfig = {
  // Sube el timeout del proxy de rewrites del SERVIDOR de Next (next dev /
  // self-host). El predict puede tardar ~150s en Render y el default de Next es
  // 30s, que cortaba la request a los 30s. OJO: en Vercel los rewrites externos
  // los maneja la infra de Vercel y esta opción NO aplica (allá manda el límite
  // de la plataforma).
  experimental: {
    proxyTimeout: 5_000_000, // 180s (default de Next: 30000 ms)
  },
  async rewrites() {
    return [
      // El health check del backend vive en /health (fuera de /api/*), así que
      // necesita una entrada específica ANTES del rewrite genérico de /api/*.
      {
        source: "/api/health",
        destination: `${API_BASE_URL}/health`,
      },
      {
        source: "/api/:path*",
        destination: `${API_BASE_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
