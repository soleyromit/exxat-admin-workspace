'use client'

import { useState } from 'react'
import { Input, Button, Card } from '@exxatdesignux/ui'
import { SiteHeader } from '@/components/site-header'
import { NotificationsPopover } from '@/components/notifications-popover'
import { ProductConnectorRow } from '@/components/product-card-connector'
import { StatsBar } from '@/components/stats-bar'
import { LeoDrawer } from '@/components/leo-drawer'
import { PRODUCTS } from '@/lib/products'

export default function WorkspacePage() {
  const [leoOpen, setLeoOpen] = useState(false)

  return (
    <>
      <SiteHeader title="Workspace" trailing={<NotificationsPopover />} />
      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl space-y-6">
          {/* Pre-workspace Leo bar — Aarti directive: Ask Leo before entering any product */}
          <div
            className="rounded-xl p-4 flex flex-col gap-3"
            style={{ background: 'var(--brand-tint)' }}
          >
            <div className="flex items-center gap-2">
              <i
                className="fa-duotone fa-solid fa-star-christmas text-lg"
                aria-hidden="true"
                style={{ color: 'var(--brand-color)' }}
              />
              <span className="text-sm font-semibold" style={{ color: 'var(--brand-color)' }}>
                Ask Leo
              </span>
              <span className="text-xs text-muted-foreground">
                — navigate, explore products, get help, book a meeting
              </span>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Ask anything about your workspace or products..."
                aria-label="Ask Leo"
                className="bg-background"
                onFocus={() => setLeoOpen(true)}
                readOnly
                style={{ cursor: 'pointer' }}
              />
              <Button
                variant="default"
                size="sm"
                onClick={() => setLeoOpen(true)}
                style={{ backgroundColor: 'var(--brand-color)' }}
              >
                Ask
              </Button>
            </div>
          </div>

          <StatsBar />

          <Card className="overflow-hidden divide-y divide-border">
            {PRODUCTS.map((product) => (
              <ProductConnectorRow key={product.id} product={product} />
            ))}
          </Card>
        </div>
      </main>
      <LeoDrawer open={leoOpen} onOpenChange={setLeoOpen} />
    </>
  )
}
