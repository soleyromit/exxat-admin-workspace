import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
  transpilePackages: ['@exxatdesignux/ui'],
  experimental: { externalDir: true },
  devIndicators: false,
  webpack(config) {
    config.resolve.alias = {
      ...config.resolve.alias,
      // '@exxat/ds' alias removed — use '@exxatdesignux/ui' npm package directly
      '@exxat/student': path.resolve(__dirname, '../../../studentUX/src'),
    }
    return config
  },
}

export default nextConfig
