import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
  experimental: { externalDir: true },
  devIndicators: false,
  webpack(config) {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@exxat/ds': path.resolve(__dirname, '../../../exxat-ds'),
    }
    return config
  },
}

export default nextConfig
