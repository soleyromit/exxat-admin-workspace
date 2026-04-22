import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
  experimental: {
    externalDir: true,
  },
  devIndicators: false,
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@exxat/student': path.resolve(__dirname, '../../../studentUX/src'),
    }
    return config
  },
}

export default nextConfig
