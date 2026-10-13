import { dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { FlatCompat } from "@eslint/eslintrc"

const __dirname = dirname(fileURLToPath(import.meta.url))
const compat = new FlatCompat({ baseDirectory: __dirname })

// Non-interactive lint (the ESLint setup prompt of `next lint` is avoided by owning the config).
const config = [
  { ignores: [".next/**", "node_modules/**", ".verify/**", "next-env.d.ts", "tsconfig.tsbuildinfo"] },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Engine and store use `_`-prefixed params for symmetry; allow them.
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    },
  },
]
export default config
