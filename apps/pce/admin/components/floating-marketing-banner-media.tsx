/** Creator Studio–style UI collage for floating marketing media header. */
export function FloatingMarketingBannerMedia() {
  return (
    <div className="relative flex size-full items-center justify-center p-2" aria-hidden>
      <div
        data-slot="marketing-banner-collage"
        className="relative flex w-[88%] -rotate-6 flex-col gap-2"
      >
        <div className="rounded-lg border border-border bg-card p-2 shadow-md">
          <div className="mb-1.5 h-2 w-12 rounded bg-brand-tint-subtle" />
          <div className="grid grid-cols-3 gap-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-square rounded bg-brand-tint" />
            ))}
          </div>
        </div>
        <div
          data-slot="marketing-banner-collage-badge"
          className="ms-6 w-[70%] rounded-lg border border-emerald-700 bg-emerald-600 px-2 py-1.5 text-[10px] font-semibold text-white shadow-sm"
        >
          24 slots filled
        </div>
      </div>
    </div>
  )
}
