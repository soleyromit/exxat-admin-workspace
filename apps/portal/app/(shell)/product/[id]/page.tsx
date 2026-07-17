import { PRODUCTS } from '@/lib/products'
import ProductDetailPage from './product-client'

export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ id: p.id }))
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ProductDetailPage id={id} />
}
