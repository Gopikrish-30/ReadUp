/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // Copy PDF.js worker to public directory
    config.resolve.alias = {
      ...config.resolve.alias,
    }
    return config
  },
  // Allow external images and resources
  images: {
    domains: ['unpkg.com', 'cdnjs.cloudflare.com'],
  },
  // Headers for CORS
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'unsafe-none',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
