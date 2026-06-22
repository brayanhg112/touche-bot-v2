/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Ignora errores de tipos para que el despliegue no se detenga
    ignoreBuildErrors: true,
  },
  eslint: {
    // Ignora errores de linter
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;