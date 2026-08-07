// Stopgap for a DS upgrade-tool bug: `exxat-ui upgrade` (run in postinstall)
// overwrites contexts/product-context.tsx with a shim that DROPS the
// `'use client'` directive. That shim re-exports ProductProvider (createContext)
// and is imported by app/(app)/layout.tsx (a server component), so without
// `'use client'` Next throws "createContext only works in Client Components".
//
// This re-adds the directive after every install. Remove once the DS payload
// ships the shim with `'use client'`.
// See docs/governance/ds-updates/2026-06-22-upgrade-tool-ports-shell-without-ui-deps.md
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const target = fileURLToPath(new URL('../contexts/product-context.tsx', import.meta.url))
if (existsSync(target)) {
  const src = readFileSync(target, 'utf8')
  if (!src.startsWith("'use client'") && !src.startsWith('"use client"')) {
    writeFileSync(target, "'use client'\n\n" + src)
    console.log('[ensure-use-client] re-added use client to contexts/product-context.tsx')
  }
}
