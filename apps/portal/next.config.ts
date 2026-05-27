import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  experimental: {
    externalDir: true,
  },
  devIndicators: false,
}

export default nextConfig
