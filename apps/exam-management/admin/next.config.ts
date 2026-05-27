import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
  experimental: {
    externalDir: true,
  },
  // react-hook-form@7.72 ships a "react-server" export condition that drops
  // Controller/FormProvider/useFormContext. Turbopack activates that condition
  // when the DS barrel (no 'use client') is processed in RSC context.
  // Marking it external forces Node require() → CJS entry, which has all exports.
  serverExternalPackages: ['react-hook-form'],
  devIndicators: false,
  webpack(config) {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@exxat/ds': path.resolve(__dirname, '../../../exxat-ds'),
      '@exxat/student': path.resolve(__dirname, '../../../studentUX/src'),
    }
    return config
  },
}

export default nextConfig
