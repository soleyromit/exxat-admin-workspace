import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
  experimental: {
    externalDir: true,
  },
  // Restrict Pages Router to a non-existent extension so the sync-extras-generated
  // src/pages/ directory is never compiled as Next.js pages. The app/ directory is
  // unaffected — it uses page.tsx/layout.tsx as special files regardless of this setting.
  pageExtensions: ['_page.tsx', '_page.ts', '_page.jsx', '_page.js'],
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
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
