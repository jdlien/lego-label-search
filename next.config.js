/**
 * @format
 * @type {import('next').NextConfig}
 */

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  /* Uncomment when ready for production
  output: 'export',
  images: { unoptimized: true },
  */
  // Public directory files are automatically served by Next.js
  experimental: {
    esmExternals: 'loose',
  },
}

module.exports = nextConfig
