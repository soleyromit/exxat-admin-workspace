import { Outlet } from "react-router-dom"

/** Passthrough layout for `/settings/*` child routes. */
export default function SettingsLayout() {
  return (
    <main className="flex-1 min-w-0">
      <Outlet />
    </main>
  )
}
