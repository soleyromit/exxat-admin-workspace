import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
  // Bundle @exxatdesignux/ui through Next.js's webpack rather than treating
  // the pre-built dist as an external. Without this, webpack sees imports
  // like `import { FormProvider } from 'react-hook-form'` inside the DS
  // bundle and tries to resolve them from the consumer's node_modules —
  // where pnpm's strict isolation returns an incompatible instance.
  transpilePackages: ['@exxatdesignux/ui'],
  experimental: {
    externalDir: true,
  },
  devIndicators: false,
  // Turbopack resolves react-hook-form with the "react-server" export
  // condition in server contexts, landing on react-server.esm.mjs which
  // strips Controller/FormProvider/useFormContext. Force the full ESM build
  // so DS Form components compile regardless of which rendering context
  // triggers the import chain.
  turbopack: {
    resolveAlias: {
      'react-hook-form': './node_modules/react-hook-form/dist/index.esm.mjs',
    },
  },
  webpack(config) {
    config.resolve.alias = {
      ...config.resolve.alias,
      // '@exxat/ds' alias removed — use '@exxatdesignux/ui' npm package directly
      '@exxat/student': path.resolve(__dirname, '../../../studentUX/src'),
      // DS dist imports react-router-dom; remap to a Next.js-safe no-op so
      // DS shell components render without requiring a <Router> wrapper.
      'react-router-dom': path.resolve(__dirname, 'lib/react-router-compat.ts'),
    }
    return config
  },
}

export default nextConfig
