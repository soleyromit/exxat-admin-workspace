export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center gap-2 p-6">
      <h1 className="text-2xl font-semibold text-foreground">Page not found</h1>
      <p className="text-sm text-muted-foreground">
        This page does not exist, or you do not have access to it.
      </p>
    </main>
  )
}
