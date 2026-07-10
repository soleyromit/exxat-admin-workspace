import { redirect } from 'next/navigation'

// List view folded into the consolidated Directory surface (matches live IA).
// Detail route (faculty/[id]) stays. Kept as a redirect so existing links resolve.
export default function Page() {
  redirect('/directory/faculty')
}
