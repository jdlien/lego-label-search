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
  // Configure static file serving from data/images directory
  async rewrites() {
    return [
      {
        source: '/data/images/:path*',
        destination: '/api/images/:path*', // We'll create this API route to serve images
      },
    ]
  },
}

module.exports = nextConfig
