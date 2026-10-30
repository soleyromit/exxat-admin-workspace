import type { NextConfig } from 'next'
import path from 'path'
import { LEGACY_REDIRECTS } from './lib/redirects'

// Mirrors apps/pce/admin (known-good) without the studentUX alias: this product
// uses @exxatdesignux/ui for every surface (docs/build/contracts/00-cross-cutting.md §13).
const nextConfig: NextConfig = {
  // Several dev servers can run from this folder at once (parallel agents); each may set its own build folder so they do
  // not overwrite each other's chunks. Unset means the default .next.
  ...(process.env.NEXT_DIST_DIR ? { distDir: process.env.NEXT_DIST_DIR } : {}),
  // Local dev only: pin the tracing root so Next does not crawl a stray parent lockfile.
  // On Vercel the platform sets the root; overriding it breaks output tracing.
  ...(process.env.VERCEL
    ? {}
    : { outputFileTracingRoot: path.resolve(__dirname, '../../..') }),
  devIndicators: false,
  // Hybrid IA: every previous URL keeps working (lib/redirects.ts).
  async redirects() {
    return LEGACY_REDIRECTS
  },
  // The DS dist imports react-router(-dom) directly (it targets a Vite stack).
  // Remap both to a Next-safe shim so DS shell components render without a <Router>.
  turbopack: {
    resolveAlias: {
      'react-router-dom': './lib/react-router-compat.tsx',
      'react-router': './lib/react-router-compat.tsx',
      '@exxatdesignux/ui/components/data-table': './components/data-table/index.tsx',
    },
  },
  webpack(config) {
    config.resolve.alias = {
      ...config.resolve.alias,
      'react-router-dom': path.resolve(__dirname, 'lib/react-router-compat.tsx'),
      'react-router': path.resolve(__dirname, 'lib/react-router-compat.tsx'),
      // One filter entry point per table (anatomy A9): the exact DataTable subpath resolves to the lab wrapper,
      // which imports the real module through '/index'. See components/data-table/index.tsx.
      '@exxatdesignux/ui/components/data-table$': path.resolve(__dirname, 'components/data-table/index.tsx'),
    }
    return config
  },
}

export default nextConfig
