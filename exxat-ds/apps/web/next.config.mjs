import bundleAnalyzer from "@next/bundle-analyzer"

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@exxat-ds/ui"],
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts", "@exxat-ds/ui"],
  },
}

export default withBundleAnalyzer(nextConfig)
