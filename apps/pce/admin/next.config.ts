import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
  experimental: {
    externalDir: true,
  },
  devIndicators: false,
  webpack(config) {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@exxat/student': path.resolve(__dirname, '../../../studentUX/src'),
      // @exxatdesignux/ui dist imports react-router-dom directly; remap to
      // a Next.js-compatible shim so DS shell components work without a <Router>.
      'react-router-dom': path.resolve(__dirname, 'lib/react-router-compat.tsx'),
    }
    return config
  },
}

export default nextConfig
