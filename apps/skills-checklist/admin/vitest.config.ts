import path from "node:path"
import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    include: ["**/*.{test,spec}.{ts,tsx}"],
    exclude: ["node_modules", ".next", "out", "build", ".verify"],
    // Inline the DS so the react-router alias below also applies inside its dist files.
    server: { deps: { inline: [/@exxatdesignux/] } },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
      // DS dist imports react-router(-dom); same shim as next.config.ts.
      "react-router-dom": path.resolve(__dirname, "lib/react-router-compat.tsx"),
      "react-router": path.resolve(__dirname, "lib/react-router-compat.tsx"),
    },
  },
})
