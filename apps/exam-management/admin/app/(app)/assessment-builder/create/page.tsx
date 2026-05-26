import { Suspense } from 'react'
import CreateCanvasClient from './create-canvas-client'

export default function CreateCanvasPage() {
  return (
    <Suspense>
      <CreateCanvasClient />
    </Suspense>
  )
}
