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
            <Button asChild variant="outline" size="sm" className="w-full">
              <a href={`mailto:${SALES_EMAIL}?subject=${encodeURIComponent(`Interested in ${product.name}`)}`}>
                Connect with sales
              </a>
            </Button>
          )}
        </div>

        <Separator />

        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-foreground">Account manager</h2>
          <div className="flex items-center gap-2.5">
            <Avatar size="sm" insetBorder>
              <AvatarImage src={stockPortraitUrl(manager.name)} alt="" />
              <AvatarFallback>{initialsFromDisplayName(manager.name)}</AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-col">
              <span className="text-sm font-medium leading-snug">{manager.name}</span>
              <a
                href={`mailto:${manager.email}`}
                className="truncate text-xs text-muted-foreground hover:underline"
              >
                {manager.email}
              </a>
            </div>
          </div>
        </div>

        {product.team && product.team.length > 0 && (
          <>
            <Separator />
            <div className="flex flex-col gap-2">
              <h2 className="text-sm font-medium text-foreground">People with access</h2>
              <div
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
                            className={`fa-light ${p.icon} text-xs`}
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
