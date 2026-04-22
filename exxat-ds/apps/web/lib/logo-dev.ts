/**
 * logo.dev brand images — publishable key is safe in the browser (like the
 * example: `https://img.logo.dev/stripe.com?token=pk_…`).
 * Override locally with `NEXT_PUBLIC_LOGO_DEV_TOKEN` if needed.
 */
export const LOGO_DEV_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_LOGO_DEV_TOKEN ?? "pk_JltPpX0KR4WONn4HFjq3Aw"

export function logoDevUrl(domain: string): string {
  const q = new URLSearchParams({ token: LOGO_DEV_PUBLISHABLE_KEY })
  return `https://img.logo.dev/${domain}?${q.toString()}`
}
