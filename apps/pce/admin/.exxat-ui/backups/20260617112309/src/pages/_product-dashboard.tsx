import { useProduct } from "@/contexts/product-context"
import Dashboard from "./dashboard"
import ProductComingSoon from "./_product-coming-soon"

export default function ProductDashboard() {
  const { product } = useProduct()
  if (product === "exxat-one-schools" || product === "exxat-one-sites") {
    return <ProductComingSoon />
  }
  return <Dashboard />
}
