import { Navigate } from "react-router"

/** Legacy entry — People now lands on Students. */
export default function AdminPeoplePage() {
  return <Navigate to="/people/students" replace />
}
