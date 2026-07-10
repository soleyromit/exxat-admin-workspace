import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import net from 'node:net'
import { spawn } from 'node:child_process'

// Auto-start the local review servers alongside `pnpm dev` so the DevReviewHUD
// is never "offline" in local development:
//   • review-bridge (7331) — per-page Opus 4.8 fixer
//   • audit-server  (7332) — vision deep DS review (Opus reads screenshots)
// Both are monorepo-wide singletons; each is port-probed so it never double-spawns.
// Dev-only.
function reviewServersAutostart(): Plugin {
  const root = path.resolve(__dirname, '../../../')
  const spawnIfFree = (port: number, script: string, label: string) => {
    const probe = net.connect(port, '127.0.0.1')
    probe.on('connect', () => probe.destroy()) // already running
    probe.on('error', () => {
      const child = spawn('node', [path.join(root, script)], { cwd: root, stdio: 'ignore', env: process.env })
      child.on('error', () => {}) // never break the dev server
      // eslint-disable-next-line no-console
      console.log(`  ➜  ${label}:  http://127.0.0.1:${port}`)
      const kill = () => { try { child.kill() } catch {} }
      process.once('exit', kill); process.once('SIGINT', () => { kill(); process.exit() }); process.once('SIGTERM', kill)
    })
  }
  return {
    name: 'review-servers-autostart',
    apply: 'serve',
    configureServer() {
      spawnIfFree(7331, 'tools/review-bridge/server.mjs', 'review-bridge (Opus fixer)')
      spawnIfFree(7332, 'tools/visual-check/audit-server.mjs', 'audit-server (deep DS review)')
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), reviewServersAutostart()],
  resolve: {
    dedupe: ['react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime'],
    alias: {
      // studentUX DS — kept aliased for future switch-back once studentUX resolves
      // its Tailwind v4 source / badge.tsx style collision gaps.
      '@exxat/student': path.resolve(__dirname, '../../../studentUX/src'),
      // Version-pinned specifiers used by studentUX components, retained for
      // future switch-back. No-ops when only Exxat-DS imports are used.
      'class-variance-authority@0.7.1': 'class-variance-authority',
      '@radix-ui/react-slot@1.1.2': '@radix-ui/react-slot',
      '@radix-ui/react-dialog@1.1.6': '@radix-ui/react-dialog',
      '@radix-ui/react-avatar@1.1.3': '@radix-ui/react-avatar',
      '@radix-ui/react-tooltip@1.1.8': '@radix-ui/react-tooltip',
      '@radix-ui/react-dropdown-menu@2.1.6': '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-collapsible@1.1.3': '@radix-ui/react-collapsible',
      '@radix-ui/react-separator@1.1.2': '@radix-ui/react-separator',
    },
  },
})
