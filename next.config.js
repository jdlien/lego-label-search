/**
 * @format
 * @type {import('next').NextConfig}
 */

const nextConfig = {
  reactStrictMode: true,
  /* Uncomment when ready for production
  output: 'export',
  images: { unoptimized: true },
  */
  // Public directory files are automatically served by Next.js

  webpack: (config, { isServer }) => {
    // Suppress the warning for libheif-js dynamic require
    config.ignoreWarnings = [
      {
        module: /libheif-js/,
        message:
          /Critical dependency: require function is used in a way in which dependencies cannot be statically extracted/,
      },
    ]

    return config
  },
}

module.exports = nextConfig
