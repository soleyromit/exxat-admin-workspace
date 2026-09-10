import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
  transpilePackages: ['@exxatdesignux/ui'],
  experimental: { externalDir: true },
  devIndicators: false,
  // Turbopack ignores webpack() below, so mirror the aliases here (matches
  // apps/pce/admin, apps/exam-management/admin).
  turbopack: {
    resolveAlias: {
      // DS dist imports react-router-dom directly; remap to a Next-safe shim
      // so DS shell components render without a <Router> wrapper.
      'react-router-dom': './lib/react-router-compat.tsx',
      // @exxatdesignux/ui@0.7+ moved its internal router imports from
      // react-router-dom to bare react-router (DS 0.7.0 breaking change) —
      // same shim covers both, since the hooks it needs are identical.
      'react-router': './lib/react-router-compat.tsx',
    },
  },
  webpack(config) {
    config.resolve.alias = {
      ...config.resolve.alias,
      // '@exxat/ds' alias removed — use '@exxatdesignux/ui' npm package directly
      '@exxat/student': path.resolve(__dirname, '../../../studentUX/src'),
      // @exxatdesignux/ui dist imports react-router-dom directly; remap to
      // a Next.js-compatible shim so DS shell components work without a <Router>.
      'react-router-dom': path.resolve(__dirname, 'lib/react-router-compat.tsx'),
      // @exxatdesignux/ui@0.7+ moved its internal router imports from
      // react-router-dom to bare react-router (DS 0.7.0 breaking change).
      'react-router': path.resolve(__dirname, 'lib/react-router-compat.tsx'),
    }
    return config
  },
}

export default nextConfig
