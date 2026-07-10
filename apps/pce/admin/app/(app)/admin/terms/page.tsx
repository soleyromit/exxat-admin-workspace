import { redirect } from 'next/navigation'

// List view folded into the consolidated Directory surface (matches live IA).
// Detail route (terms/[id]) stays. Kept as a redirect so existing links resolve.
export default function Page() {
  redirect('/directory/term')
}
