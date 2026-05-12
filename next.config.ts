import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  typedRoutes: false,
  serverExternalPackages: ['postgres', 'bcryptjs'],
};

export default nextConfig;
