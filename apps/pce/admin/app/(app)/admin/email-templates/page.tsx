import { redirect } from 'next/navigation'

// Folded into Central Settings (matches live pce-three IA). Kept as a redirect so
// existing links / command-palette entries still resolve.
export default function Page() {
  redirect('/admin/eval-settings?section=communication')
}
