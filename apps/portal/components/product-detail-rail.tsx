'use client'

// DS adoption: documented hand-roll — see docs/governance/ds-adoption.md § portal.
// StatusBadge, Avatar suite (AvatarGroup faces), Button, Card: imported from @exxatdesignux/ui.
// "Works with" tile strip: no DS organism; product-specific portal pattern.

import Link from 'next/link'
import {
  Card,
  CardContent,
  Button,
  Separator,
  StatusBadge,
  Avatar,
  AvatarImage,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
} from '@exxatdesignux/ui'
import { stockPortraitUrl } from '@/lib/stock-portrait'
// AM avatars render initials only (no stock portrait) — per the Jul 17 portal decision,
// and because name→portrait hashing produced mismatched faces for named contacts.
import { PRODUCTS, SALES_EMAIL, type Product } from '@/lib/products'
import { initialsFromDisplayName } from '@/lib/initials-from-name'

const SUBSCRIPTION_BADGE: Record<
  Product['subscriptionStatus'],
  { label: string; tone: 'success' | 'warning' | 'neutral'; icon: string }
> = {
  'active':         { label: 'Active subscription', tone: 'success', icon: 'fa-circle-check' },
  'trial':          { label: 'Trial',               tone: 'warning', icon: 'fa-clock' },
  'not-subscribed': { label: 'Not subscribed',      tone: 'neutral', icon: 'fa-box-archive' },
}

export function ProductDetailRail({ product }: { product: Product }) {
  const badge = SUBSCRIPTION_BADGE[product.subscriptionStatus]
  const manager = product.accountManager
  const worksWith = (product.worksWith ?? [])
    .map((id) => PRODUCTS.find((p) => p.id === id))
    .filter((p): p is Product => Boolean(p))

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-4">
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-foreground">Subscription</h2>
          <div>
            <StatusBadge label={badge.label} tone={badge.tone} icon={badge.icon} size="md" />
          </div>
          {product.subscriptionStatus === 'not-subscribed' && (
            <div className="flex flex-col gap-1.5">
              <Button asChild variant="default" size="sm" className="w-full">
                <a href={`mailto:${SALES_EMAIL}?subject=${encodeURIComponent(`Interested in ${product.name}`)}`}>
                  Connect with sales
                </a>
              </Button>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Pricing, rollout planning, and a guided demo for your program.
              </p>
            </div>
          )}
        </div>

        {!product.comingSoon && (
          <>
            <Separator />
            <div className="flex flex-col gap-1.5">
              <h2 className="text-sm font-medium text-foreground">Open in</h2>
              <ul className="flex flex-col gap-1">
                {[
                  { label: 'Admin', url: product.adminUrl, icon: 'fa-shield-halved' },
                  { label: 'Student', url: product.studentUrl, icon: 'fa-user' },
                ].map((surface) => (
                  <li key={surface.label}>
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start gap-2.5 px-1.5"
                    >
                      <a href={surface.url} target="_blank" rel="noreferrer">
                        <i className={`fa-light ${surface.icon} text-xs text-muted-foreground`} aria-hidden="true" />
                        <span className="truncate">{surface.label}</span>
                        <i className="fa-light fa-arrow-up-right ms-auto text-xs text-muted-foreground" aria-hidden="true" />
                      </a>
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

        <Separator />

        <div className="flex flex-col gap-2.5">
          <h2 className="text-sm font-medium text-foreground">Your account manager</h2>
          <div className="flex items-center gap-2.5">
            <Avatar size="sm" insetBorder>
              <AvatarFallback>{initialsFromDisplayName(manager.name)}</AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-col">
              <span className="text-sm font-medium leading-snug">{manager.name}</span>
              <span className="truncate text-xs text-muted-foreground">{manager.email}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <Button asChild variant="outline" size="sm">
              <a href={`mailto:${manager.email}?subject=${encodeURIComponent(`${product.name} — question`)}`}>
                Email
              </a>
            </Button>
            <Button asChild variant="outline" size="sm">
              <a
                href={`mailto:${manager.email}?subject=${encodeURIComponent(`Meeting request — ${product.name}`)}&body=${encodeURIComponent('Hi, could we set up a time to talk through ' + product.name + ' for our program?')}`}
              >
                Book a meeting
              </a>
            </Button>
          </div>
        </div>

        {product.team && product.team.length > 0 && (
          <>
            <Separator />
            <div className="flex flex-col gap-2">
              <h2 className="text-sm font-medium text-foreground">People with access</h2>
              <div
                role="group"
                className="flex items-center gap-2"
                aria-label={`${product.team.length} people have access`}
              >
                <AvatarGroup>
                  {product.team.slice(0, 4).map((name) => (
                    <Avatar key={name} size="sm" insetBorder>
                      <AvatarImage src={stockPortraitUrl(name)} alt="" />
                      <AvatarFallback>{initialsFromDisplayName(name)}</AvatarFallback>
                    </Avatar>
                  ))}
                  {product.team.length > 4 && (
                    <AvatarGroupCount>+{product.team.length - 4}</AvatarGroupCount>
                  )}
                </AvatarGroup>
                <span className="text-xs text-muted-foreground">{product.team.length} people</span>
              </div>
            </div>
          </>
        )}

        {worksWith.length > 0 && (
          <>
            <Separator />
            <div className="flex flex-col gap-1.5">
              <h2 className="text-sm font-medium text-foreground">Works with</h2>
              <ul className="flex flex-col gap-1">
                {worksWith.map((p) => (
                  <li key={p.id}>
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start gap-2.5 px-1.5"
                    >
                      <Link href={`/product/${p.id}`}>
                        <span
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
                          style={{
                            background: `linear-gradient(135deg, var(--product-${p.colorKey}-from), var(--product-${p.colorKey}-to))`,
                          }}
                        >
                          <i
                            className={`fa-solid ${p.icon} text-xs`}
                            aria-hidden="true"
                            style={{ color: `var(--product-${p.colorKey}-icon)` }}
                          />
                        </span>
                        <span className="truncate">{p.name}</span>
                      </Link>
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
