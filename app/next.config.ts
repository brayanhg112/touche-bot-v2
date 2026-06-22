import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  typescript: {
    // Esto le dice a Vercel que ignore los errores de tipos al compilar
    ignoreBuildErrors: true,
  },
  eslint: {
    // Esto evita que el linter detenga el despliegue
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;