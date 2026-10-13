import { ReviewClient } from "@/components/review/review-client"

// The layout owns the surface so state (the result banner) survives opening and closing the detail route.
export default function ReviewLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ReviewClient />
      {children}
    </>
  )
}
