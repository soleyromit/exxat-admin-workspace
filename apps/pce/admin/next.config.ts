import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
  // Pin the workspace root. Without this, Next infers the root from the
  // nearest lockfile above this dir — a stray ~/package-lock.json once made
  // it root file-tracing at the entire home directory, crawling that whole
  // tree on every compile (high CPU). Anchor it to the Work monorepo root.
  outputFileTracingRoot: path.resolve(__dirname, '../../..'),
  experimental: {
    externalDir: true,
  },
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  devIndicators: false,
  // Turbopack ignores webpack() below, so mirror the aliases here. tsconfig
  // `paths` already maps @exxat/student/*, so only the two bare-module
  // remaps are needed (matches the known-good exam-management config).
  turbopack: {
    resolveAlias: {
      // DS dist imports react-router-dom directly; remap to a Next-safe shim
      // so DS shell components render without a <Router> wrapper.
      'react-router-dom': './lib/react-router-compat.tsx',
      // Turbopack otherwise resolves react-hook-form's "react-server" export
      // (react-server.esm.mjs) which strips Controller/FormProvider/
      // useFormContext. Force the full ESM build so DS Form components compile.
      'react-hook-form': './node_modules/react-hook-form/dist/index.esm.mjs',
    },
  },
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
