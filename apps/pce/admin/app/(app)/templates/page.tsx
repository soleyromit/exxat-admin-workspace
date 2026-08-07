import { redirect } from 'next/navigation'

// Templates moved into Settings as a tab (left-nav entry removed). Kept as a
// redirect so existing links / command-palette entries still resolve.
// Detail routes (/templates/[id], /templates/new) are unaffected.
export default function Page() {
  redirect('/admin/eval-settings?section=templates')
}
