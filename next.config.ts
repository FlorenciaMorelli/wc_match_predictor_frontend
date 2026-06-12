import type { NextConfig } from "next";

// The browser talks to the API same-origin via "/api/*"; Next proxies those
// requests to the real backend server-side. This sidesteps CORS entirely (no
// preflight, no Access-Control-Allow-Origin dependency) and keeps the backend
// URL out of the client bundle. Override the target with BACKEND_ORIGIN.
const BACKEND_ORIGIN =
  process.env.BACKEND_ORIGIN ?? "https://wc-match-predictor.onrender.com";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${BACKEND_ORIGIN}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
