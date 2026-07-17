'use client'

import { notFound } from 'next/navigation'
import {
  Button,
  Badge,
  Card,
  CardContent,
  Separator,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@exxatdesignux/ui'
import { SiteHeader } from '@/components/site-header'
import { NotificationsPopover } from '@/components/notifications-popover'
import { ProductDetailRail } from '@/components/product-detail-rail'
import { PRODUCTS } from '@/lib/products'
import { ILLUSTRATIONS } from '@/lib/illustrations'
import type { Resource, ReleaseNote, RoadmapItem } from '@/lib/products'

// ─── Resource card ────────────────────────────────────────────────────────────

const KIND_META: Record<Resource['kind'], { icon: string; label: string; cta: string }> = {
  webinar:       { icon: 'fa-screen-users', label: 'Webinar',       cta: 'Register' },
  video:         { icon: 'fa-circle-play',  label: 'Video',         cta: 'Watch'    },
  documentation: { icon: 'fa-book-open',    label: 'Docs',          cta: 'Read'     },
  support:       { icon: 'fa-life-ring',    label: 'Support',       cta: 'Open'     },
}

function ResourceCard({ resource }: { resource: Resource }) {
  const meta = KIND_META[resource.kind]
  return (
    <Card>
      <CardContent className="flex items-start gap-3 p-4">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg mt-0.5"
          style={{ backgroundColor: 'var(--muted)' }}
        >
          <i className={`fa-light ${meta.icon} text-sm text-muted-foreground`} aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium leading-snug">{resource.title}</span>
            <Badge variant="secondary" className="rounded text-xs">{meta.label}</Badge>
            {resource.status === 'upcoming' && (
              <Badge variant="secondary" className="rounded text-xs">Upcoming</Badge>
            )}
          </div>
          {(resource.date || resource.host) && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground flex-wrap">
              {resource.date && <span>{resource.date}</span>}
              {resource.date && resource.duration && <span>·</span>}
              {resource.duration && <span>{resource.duration}</span>}
              {resource.host && <span>·</span>}
              {resource.host && <span>{resource.host}</span>}
            </div>
          )}
          <p className="text-xs text-muted-foreground leading-relaxed">{resource.description}</p>
        </div>
        <Button asChild variant="outline" size="sm" className="shrink-0 self-start">
          <a href={resource.url} target="_blank" rel="noreferrer">
            {meta.cta}
            <i className="fa-light fa-arrow-up-right" aria-hidden="true" />
          </a>
        </Button>
      </CardContent>
    </Card>
  )
}

// ─── Release note row ────────────────────────────────────────────────────────

function ReleaseNoteSection({ release }: { release: ReleaseNote }) {
  return (
    <div className="flex gap-5">
      <div className="flex flex-col items-end gap-1 shrink-0 w-20 pt-0.5">
        <Badge variant="secondary" className="rounded font-mono text-xs">v{release.version}</Badge>
        <span className="text-xs text-muted-foreground text-right leading-tight">{release.date}</span>
      </div>
      <div className="flex-1 flex flex-col gap-1.5 pb-6 border-l border-border pl-4">
        {release.notes.map((note, i) => (
          <div key={i} className="flex items-start gap-2 text-sm">
            <i className="fa-light fa-circle-dot text-xs text-muted-foreground mt-[3px] shrink-0" aria-hidden="true" />
            <span>{note}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Roadmap row ─────────────────────────────────────────────────────────────

function RoadmapRow({ item }: { item: RoadmapItem }) {
  return (
    <div className="flex gap-5">
      <div className="flex flex-col items-end gap-1 shrink-0 w-20 pt-0.5">
        <Badge variant="secondary" className="rounded font-mono text-xs">{item.quarter}</Badge>
        {item.status === 'in-progress' && (
          <span className="text-xs text-muted-foreground text-right leading-tight">In progress</span>
        )}
      </div>
      <div className="flex-1 flex flex-col gap-0.5 pb-5 border-l border-border pl-4">
        <span className="text-sm font-medium">{item.title}</span>
        {item.description && (
          <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
        )}
      </div>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ProductDetailPage({ id }: { id: string }) {
  const product = PRODUCTS.find((p) => p.id === id)
  if (!product) notFound()

  const Illustration = ILLUSTRATIONS[product.colorKey]

  return (
    <>
      {/* Back variant — the serif <h1> below carries the page identity (SiteHeader API guidance). */}
      <SiteHeader
        back={{ label: 'Workspace', href: '/' }}
        documentTitle={product.name}
        trailing={<NotificationsPopover />}
      />
      <main className="flex-1 overflow-auto">

            {/* Hero */}
            <div
              className="relative h-44 w-full overflow-hidden"
              style={{
                background: `linear-gradient(135deg, var(--product-${product.colorKey}-from), var(--product-${product.colorKey}-to))`,
                color: `var(--product-${product.colorKey}-icon)`,
              }}
            >
              {Illustration && <div className="absolute inset-0"><Illustration /></div>}
            </div>

            <div className="relative mx-auto max-w-4xl px-6 lg:grid lg:grid-cols-[minmax(0,1fr)_16rem] lg:gap-10">
            <div className="min-w-0">

              {/* Floating icon — overlaps hero seam only, button is below */}
              <div className="-mt-7 mb-4">
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-xl border-4 border-background"
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
              </div>

              {/* Name + CTA on same row, fully in content area */}
              <div className="flex items-start justify-between gap-4 mb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="font-heading text-2xl font-semibold">{product.name}</h1>
                  {product.comingSoon && (
                    <Badge variant="secondary" className="rounded text-xs">
                      {product.expectedLaunch ? `Coming ${product.expectedLaunch}` : 'Coming soon'}
                    </Badge>
                  )}
                </div>
                {!product.comingSoon && (
                  <Button asChild variant="default" size="sm" className="shrink-0">
                    <a href={product.adminUrl} target="_blank" rel="noreferrer">
                      Open Admin
                      <i className="fa-light fa-arrow-up-right" aria-hidden="true" />
                    </a>
                  </Button>
                )}
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed mb-2">{product.description}</p>
              <div className="flex items-center gap-2 flex-wrap mb-5">
                {!product.comingSoon && (
                  <Badge variant="secondary" className="rounded text-xs">v{product.version}</Badge>
                )}
                <Badge variant="secondary" className="rounded text-xs">{product.category}</Badge>
                {product.universities.length > 0 && (
                  <Badge variant="secondary" className="rounded text-xs">
                    <i className="fa-light fa-building-columns me-1" aria-hidden="true" />
                    Used by {product.universities.length} institutions
                  </Badge>
                )}
              </div>

              {/* Tabs */}
              <Tabs defaultValue="overview" className="pb-10">
                <div className="border-b border-border mb-5">
                  <TabsList variant="line" className="gap-0">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="resources">
                      Resources{product.resources.length > 0 && ` (${product.resources.length})`}
                    </TabsTrigger>
                    <TabsTrigger value="whats-new">What's new</TabsTrigger>
                  </TabsList>
                </div>

                {/* ── Overview ── */}
                <TabsContent value="overview" className="flex flex-col gap-6">

                  {/* Features */}
                  {product.features.length === 0 && (
                    <p className="text-xs text-muted-foreground">No features listed yet.</p>
                  )}
                  {product.features.length > 0 && (
                    <div className="flex flex-col gap-3">
                      <h2 className="text-sm font-medium text-foreground">Key features</h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2.5 gap-x-8">
                        {product.features.map((feature, i) => (
                          <div key={i} className="flex items-start gap-2.5">
                            <i
                              className="fa-light fa-circle-check text-xs mt-0.5 shrink-0"
                              style={{ color: `var(--product-${product.colorKey}-icon)` }}
                              aria-hidden="true"
                            />
                            <span className="text-sm leading-snug">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Institutions */}
                  {product.universities.length > 0 && (
                    <>
                      <Separator />
                      <div className="flex flex-col gap-3">
                        <h2 className="text-sm font-medium text-foreground">Institutions using this</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-8">
                          {product.universities.map((uni, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <i className="fa-light fa-building-columns text-xs text-muted-foreground shrink-0" aria-hidden="true" />
                              <span className="text-sm">{uni}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {product.universities.length === 0 && product.comingSoon && (
                    <div className="flex flex-col items-center gap-2 py-10 text-center">
                      <i className="fa-light fa-building-columns text-3xl text-muted-foreground" aria-hidden="true" />
                      <h2 className="text-sm font-medium">Not launched yet</h2>
                      <p className="text-xs text-muted-foreground">Institutions will appear here once this product launches.</p>
                    </div>
                  )}
                  {product.universities.length === 0 && !product.comingSoon && (
                    <div className="flex flex-col items-center gap-2 py-10 text-center">
                      <i className="fa-light fa-building-columns text-3xl text-muted-foreground" aria-hidden="true" />
                      <h2 className="text-sm font-medium">No institutions yet</h2>
                      <p className="text-xs text-muted-foreground">Adoption will appear here as programs come on board.</p>
                    </div>
                  )}
                </TabsContent>

                {/* ── Resources ── */}
                <TabsContent value="resources" className="flex flex-col gap-3">
                  {product.resources.length > 0 ? (
                    product.resources.map((resource, i) => (
                      <ResourceCard key={i} resource={resource} />
                    ))
                  ) : (
                    <div className="flex flex-col items-center gap-2 py-10 text-center">
                      <i className="fa-light fa-screen-users text-3xl text-muted-foreground" aria-hidden="true" />
                      <h2 className="text-sm font-medium">No resources yet</h2>
                      <p className="text-xs text-muted-foreground">Webinars, videos, and docs will be added as they become available.</p>
                    </div>
                  )}
                </TabsContent>

                {/* ── What's New ── */}
                <TabsContent value="whats-new">
                  {product.roadmap.length === 0 && product.releaseNotes.length === 0 && (
                    <div className="flex flex-col items-center gap-2 py-10 text-center">
                      <i className="fa-light fa-rocket text-3xl text-muted-foreground" aria-hidden="true" />
                      <h2 className="text-sm font-medium">Nothing here yet</h2>
                      <p className="text-xs text-muted-foreground">Release notes and roadmap updates will appear here at launch.</p>
                    </div>
                  )}

                  {/* Roadmap — upcoming */}
                  {product.roadmap.length > 0 && (
                    <div className="flex flex-col gap-1 mb-2">
                      <h2 className="text-sm font-medium text-foreground mb-3">Upcoming</h2>
                      {product.roadmap.map((item, i) => (
                        <RoadmapRow key={i} item={item} />
                      ))}
                    </div>
                  )}

                  {/* Release notes — past */}
                  {product.releaseNotes.length > 0 && (
                    <>
                      {product.roadmap.length > 0 && <Separator className="mb-5" />}
                      <h2 className="text-sm font-medium text-foreground mb-3">Release history</h2>
                      <div className="flex flex-col">
                        {product.releaseNotes.map((release, i) => (
                          <ReleaseNoteSection key={i} release={release} />
                        ))}
                      </div>
                    </>
                  )}
                </TabsContent>
              </Tabs>

            </div>

            <aside aria-label="Product information" className="pb-10 lg:pt-8">
              <ProductDetailRail product={product} />
            </aside>

            </div>
          </main>
    </>
  )
}
