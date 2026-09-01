import type { NextConfig } from "next";

const BACKEND_URL = process.env.SENTINELAI_BACKEND_URL || "http://127.0.0.1:8765";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        // Proxy /api/backend/* → FastAPI backend. The frontend uses
        // /api/backend as a stable prefix so the same code works in
        // dev (with the proxy) and in production (when the backend
        // runs alongside the app).
        source: "/api/backend/:path*",
        destination: `${BACKEND_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
