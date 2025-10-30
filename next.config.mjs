/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  // Disable static optimization for pages that require runtime environment
  output: 'standalone',
};

export default nextConfig;
