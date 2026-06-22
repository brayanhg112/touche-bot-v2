import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true, // ¡Esto ahora sí lo leerá!
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
