'use client'

import { notFound, useParams } from 'next/navigation'
import Link from 'next/link'
import {
  SidebarProvider,
  SidebarInset,
  TooltipProvider,
  Button,
  Badge,
  Card,
  CardContent,
  Separator,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@exxat/ds/packages/ui/src'
import { AppSidebar } from '@/components/app-sidebar'
import { PRODUCTS } from '@/lib/products'
import { ILLUSTRATIONS } from '@/lib/illustrations'
import type { Review, ReleaseNote } from '@/lib/products'

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <i
          key={star}
          className={star <= rating ? 'fa-solid fa-star' : star - 0.5 <= rating ? 'fa-solid fa-star-half-stroke' : 'fa-light fa-star'}
          aria-hidden="true"
          style={{ fontSize: 11, color: 'var(--product-em-icon)' }}
        />
      ))}
    </span>
  )
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-semibold">{review.author}</span>
            <span className="text-xs text-muted-foreground">{review.role} · {review.institution}</span>
          </div>
          <span className="text-xs text-muted-foreground shrink-0">{review.date}</span>
        </div>
        <StarRating rating={review.rating} />
        <p className="text-sm text-foreground leading-relaxed">{review.text}</p>
      </CardContent>
    </Card>
  )
}

function ReleaseNoteSection({ release }: { release: ReleaseNote }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <Badge variant="secondary" className="rounded font-mono text-xs">v{release.version}</Badge>
        <span className="text-xs text-muted-foreground">{release.date}</span>
      </div>
      <ul className="flex flex-col gap-1 pl-1">
        {release.notes.map((note, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-foreground">
            <i className="fa-light fa-circle-small text-muted-foreground mt-1.5 shrink-0" style={{ fontSize: 8 }} aria-hidden="true" />
            {note}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const product = PRODUCTS.find((p) => p.id === id)
  if (!product) notFound()

  const Illustration = ILLUSTRATIONS[product.colorKey]
  const avgRating = product.reviews.length
    ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
    : null

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          {/* Header with back nav */}
          <header
            className="flex h-14 shrink-0 items-center gap-3 px-4"
            style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--background)' }}
          >
            <Button asChild variant="ghost" size="icon-sm">
              <Link href="/">
                <i className="fa-light fa-arrow-left" aria-hidden="true" />
              </Link>
            </Button>
            <Separator orientation="vertical" className="h-4" />
            <nav className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link href="/" className="hover:text-foreground transition-colors">Workspace</Link>
              <i className="fa-light fa-chevron-right text-xs" aria-hidden="true" />
              <span className="text-foreground font-medium">{product.name}</span>
            </nav>
          </header>

          <main className="flex-1 overflow-auto">
            {/* Hero illustration */}
            <div
              className="relative h-48 w-full flex items-center justify-center overflow-hidden"
              style={{
                background: `linear-gradient(135deg, var(--product-${product.colorKey}-from), var(--product-${product.colorKey}-to))`,
                color: `var(--product-${product.colorKey}-icon)`,
                opacity: product.comingSoon ? 0.6 : 1,
              }}
            >
              {Illustration && (
                <div className="absolute inset-0">
                  <Illustration />
                </div>
              )}
            </div>

            <div className="max-w-3xl mx-auto px-6 py-6 flex flex-col gap-6">
              {/* Identity row */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl -mt-10 ring-4 ring-background"
                    style={{
                      background: `linear-gradient(135deg, var(--product-${product.colorKey}-from), var(--product-${product.colorKey}-to))`,
                    }}
                  >
                    <i
                      className={`fa-light ${product.icon} text-2xl`}
                      aria-hidden="true"
                      style={{ color: `var(--product-${product.colorKey}-icon)` }}
                    />
                  </div>
                  <div className="flex flex-col gap-1 mt-1">
                    <h1 className="text-xl font-semibold leading-tight">{product.name}</h1>
                    <p className="text-sm text-muted-foreground">{product.description}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {!product.comingSoon && (
                        <Badge variant="secondary" className="rounded text-xs">v{product.version}</Badge>
                      )}
                      <Badge variant="secondary" className="rounded text-xs">{product.category}</Badge>
                      {product.comingSoon && (
                        <Badge variant="secondary" className="rounded text-xs">Coming Soon</Badge>
                      )}
                      {avgRating && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <StarRating rating={Math.round(avgRating)} />
                          {avgRating.toFixed(1)} ({product.reviews.length} reviews)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {!product.comingSoon && (
                  <Button asChild variant="default" className="shrink-0">
                    <a href={product.adminUrl} target="_blank" rel="noreferrer">
                      Open Admin
                      <i className="fa-light fa-arrow-up-right" aria-hidden="true" />
                    </a>
                  </Button>
                )}
              </div>

              <Separator />

              {/* Tabbed content */}
              <Tabs defaultValue="overview">
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="reviews">
                    Reviews {product.reviews.length > 0 && `(${product.reviews.length})`}
                  </TabsTrigger>
                  <TabsTrigger value="whats-new">
                    What's New
                  </TabsTrigger>
                  {!product.comingSoon && product.extra && (
                    <TabsTrigger value="surfaces">Surfaces</TabsTrigger>
                  )}
                </TabsList>

                {/* Overview tab */}
                <TabsContent value="overview" className="flex flex-col gap-6 pt-4">
                  {/* Features */}
                  {product.features.length > 0 && (
                    <div className="flex flex-col gap-3">
                      <h2 className="text-sm font-semibold">Key Features</h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {product.features.map((feature, i) => (
                          <div key={i} className="flex items-start gap-2.5">
                            <i className="fa-light fa-circle-check text-xs mt-0.5 shrink-0" style={{ color: `var(--product-${product.colorKey}-icon)` }} aria-hidden="true" />
                            <span className="text-sm">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Universities */}
                  {product.universities.length > 0 && (
                    <>
                      <Separator />
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <h2 className="text-sm font-semibold">Institutions Using This</h2>
                          <span className="text-xs text-muted-foreground">{product.universities.length} institutions</span>
                        </div>
                        <div className="flex flex-col gap-2">
                          {product.universities.map((uni, i) => (
                            <div key={i} className="flex items-center gap-2.5">
                              <i className="fa-light fa-building-columns text-xs text-muted-foreground shrink-0" aria-hidden="true" />
                              <span className="text-sm">{uni}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {product.universities.length === 0 && product.comingSoon && (
                    <div className="flex flex-col items-center gap-2 py-8 text-center">
                      <i className="fa-light fa-building-columns text-3xl text-muted-foreground" aria-hidden="true" />
                      <p className="text-sm text-muted-foreground">Institutions will appear here once this product launches.</p>
                    </div>
                  )}
                </TabsContent>

                {/* Reviews tab */}
                <TabsContent value="reviews" className="flex flex-col gap-4 pt-4">
                  {avgRating ? (
                    <>
                      {/* Rating summary */}
                      <Card>
                        <CardContent className="flex items-center gap-6 p-4">
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-4xl font-bold leading-none">{avgRating.toFixed(1)}</span>
                            <StarRating rating={Math.round(avgRating)} />
                            <span className="text-xs text-muted-foreground">{product.reviews.length} reviews</span>
                          </div>
                          <Separator orientation="vertical" className="h-16" />
                          <div className="flex-1 flex flex-col gap-1">
                            {[5, 4, 3, 2, 1].map((star) => {
                              const count = product.reviews.filter((r) => r.rating === star).length
                              const pct = product.reviews.length ? (count / product.reviews.length) * 100 : 0
                              return (
                                <div key={star} className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <span className="w-4 text-right">{star}</span>
                                  <i className="fa-solid fa-star" style={{ fontSize: 9, color: 'var(--muted-foreground)' }} aria-hidden="true" />
                                  <div className="flex-1 h-1.5 rounded-full" style={{ backgroundColor: 'var(--muted)' }}>
                                    <div
                                      className="h-1.5 rounded-full"
                                      style={{ width: `${pct}%`, backgroundColor: `var(--product-${product.colorKey}-icon)` }}
                                    />
                                  </div>
                                  <span className="w-4">{count}</span>
                                </div>
                              )
                            })}
                          </div>
                        </CardContent>
                      </Card>
                      {product.reviews.map((review, i) => (
                        <ReviewCard key={i} review={review} />
                      ))}
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-2 py-8 text-center">
                      <i className="fa-light fa-star text-3xl text-muted-foreground" aria-hidden="true" />
                      <p className="text-sm text-muted-foreground">No reviews yet.</p>
                    </div>
                  )}
                </TabsContent>

                {/* What's New tab */}
                <TabsContent value="whats-new" className="flex flex-col gap-6 pt-4">
                  {product.releaseNotes.length > 0 ? (
                    product.releaseNotes.map((release, i) => (
                      <div key={i}>
                        <ReleaseNoteSection release={release} />
                        {i < product.releaseNotes.length - 1 && <Separator className="mt-6" />}
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center gap-2 py-8 text-center">
                      <i className="fa-light fa-rocket text-3xl text-muted-foreground" aria-hidden="true" />
                      <p className="text-sm text-muted-foreground">Release notes will appear here at launch.</p>
                    </div>
                  )}
                </TabsContent>

                {/* Surfaces tab */}
                {!product.comingSoon && product.extra && (
                  <TabsContent value="surfaces" className="flex flex-col gap-3 pt-4">
                    <div className="flex flex-col gap-2">
                      {[
                        { label: 'Admin', url: product.adminUrl, icon: 'fa-shield-halved', desc: 'Faculty and staff administration portal' },
                        { label: 'Student', url: product.studentUrl, icon: 'fa-user', desc: 'Student-facing experience' },
                        ...(product.extra ? [{ label: product.extra.label, url: product.extra.url, icon: 'fa-file-pen', desc: 'Exam delivery surface for test-takers' }] : []),
                      ].map((surface) => (
                        <Card key={surface.label}>
                          <CardContent className="flex items-center gap-3 p-4">
                            <i className={`fa-light ${surface.icon} text-sm text-muted-foreground`} aria-hidden="true" />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium">{surface.label}</div>
                              <div className="text-xs text-muted-foreground">{surface.desc}</div>
                            </div>
                            <Button asChild variant="outline" size="sm">
                              <a href={surface.url} target="_blank" rel="noreferrer">
                                Open <i className="fa-light fa-arrow-up-right" aria-hidden="true" />
                              </a>
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>
                )}
              </Tabs>
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
