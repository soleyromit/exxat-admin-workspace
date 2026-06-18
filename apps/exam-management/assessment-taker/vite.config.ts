import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
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
