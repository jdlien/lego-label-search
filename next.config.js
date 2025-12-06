/**
 * @format
 * @type {import('next').NextConfig}
 */

const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Ensure API routes work properly in production
  serverExternalPackages: ['sharp', 'heic-convert'],
  /* Uncomment when ready for production
  output: 'export',
  images: { unoptimized: true },
  */
  // Public directory files are automatically served by Next.js
  // Note: webpack config removed - Turbopack is now default in Next.js 16
}

module.exports = nextConfig
