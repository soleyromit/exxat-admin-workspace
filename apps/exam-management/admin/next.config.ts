import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
  // Pin the workspace root for LOCAL dev only (stops Next inferring it from a
  // stray lockfile higher up and crawling the home dir). On Vercel the platform
  // sets the root via rootDirectory; overriding it there breaks output tracing
  // (routes-manifest.json path doubling), so skip it when VERCEL is set.
  ...(process.env.VERCEL
    ? {}
    : { outputFileTracingRoot: path.resolve(__dirname, '../../..') }),
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
  // The `exxat-ui upgrade` postinstall regenerates a Vite-scaffold shell under
  // src/pages + components/* that imports Vite-only modules (react-router-dom,
  // motion/react). Those files are not in the app-router import graph, but Next
  // type-checks the whole project at build. Skip it (matches apps/pce/admin).
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  // Turbopack resolves react-hook-form with the "react-server" export
  // condition in server contexts, landing on react-server.esm.mjs which
  // strips Controller/FormProvider/useFormContext. Force the full ESM build
  // so DS Form components compile regardless of which rendering context
  // triggers the import chain.
  turbopack: {
    resolveAlias: {
      'react-hook-form': './node_modules/react-hook-form/dist/index.esm.mjs',
      // The generated Vite-scaffold shell under src/pages (+ the DS dist)
      // imports react-router-dom directly. The webpack block below remaps it,
      // but the dev server runs --turbopack, so mirror the alias here too —
      // otherwise Next's Pages-Router scan compiles src/pages/_error.tsx,
      // fails to resolve react-router-dom, and 500s every route.
      'react-router-dom': './lib/react-router-compat.ts',
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
