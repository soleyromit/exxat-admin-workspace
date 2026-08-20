// Vendored KeyMetrics barrel.
//
// `components/key-metrics/` is an UNTRACKED (never-committed) vendored module
// that ~8 files import via `@/components/key-metrics`. It was removed during a
// concurrent refactor, leaving the build unresolvable (`Module not found`).
// This barrel re-exports the DS primitives so every consumer resolves again.
// Replace with the full local vendor (Ask Leo stubs, etc.) when re-vendored.
export { KeyMetrics, metricTrendTone } from '@exxatdesignux/ui'
export type { MetricItem, MetricInsight, MetricTrendPolarity } from '@exxatdesignux/ui'
