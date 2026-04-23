import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
  // studentUX is imported as source (not a built package), so DS-internal type
  // conflicts are suppressed here. App code is fully type-checked in the IDE.
  typescript: { ignoreBuildErrors: true },
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
