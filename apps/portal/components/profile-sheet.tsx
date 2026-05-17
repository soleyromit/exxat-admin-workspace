'use client'

import { useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  Avatar,
  AvatarFallback,
  Badge,
  Separator,
  Button,
  Checkbox,
} from '@exxat/ds/packages/ui/src'
import { PRODUCTS } from '@/lib/products'

function subscriptionLabel(status: 'active' | 'trial' | 'not-subscribed') {
  if (status === 'active') return 'Active'
  if (status === 'trial') return 'Trial'
  return 'Not subscribed'
}

function statusBadgeStyle(status: 'active' | 'trial' | 'not-subscribed') {
  if (status === 'active') {
    return {
      backgroundColor: 'color-mix(in oklch, var(--brand-color) 10%, var(--background))',
      color: 'var(--brand-color)',
      borderColor: 'color-mix(in oklch, var(--brand-color) 30%, var(--background))',
    }
  }
  if (status === 'trial') {
    return {
      backgroundColor: 'oklch(0.97 0.04 85)',
      color: 'oklch(0.55 0.15 75)',
      borderColor: 'oklch(0.75 0.15 85)',
    }
  }
  return {
    backgroundColor: 'var(--muted)',
    color: 'var(--muted-foreground)',
    borderColor: 'var(--border)',
  }
}

type ProfileSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProfileSheet({ open, onOpenChange }: ProfileSheetProps) {
  const [notifyFeatures, setNotifyFeatures] = useState(true)
  const [notifyOffers, setNotifyOffers] = useState(true)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Profile</SheetTitle>
          <SheetDescription>Account settings and subscriptions</SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-4 px-4 pb-4 overflow-y-auto flex-1">
          {/* User info */}
          <div className="flex items-center gap-3 pt-1">
            <Avatar className="h-12 w-12 rounded-lg">
              <AvatarFallback className="rounded-lg text-sm font-semibold">RS</AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold">Romit Soley</span>
              <span className="text-xs text-muted-foreground">Product Designer II</span>
              <span className="text-xs text-muted-foreground">soleyromit@gmail.com</span>
            </div>
          </div>

          <Separator />

          {/* Subscriptions */}
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Subscriptions
            </p>
            {PRODUCTS.map(product => (
              <div key={product.id} className="flex items-center justify-between gap-2 py-0.5">
                <span className="text-sm">{product.name}</span>
                <Badge
                  variant="outline"
                  className="rounded text-xs"
                  style={statusBadgeStyle(product.subscriptionStatus)}
                >
                  {subscriptionLabel(product.subscriptionStatus)}
                </Badge>
              </div>
            ))}
          </div>

          <Separator />

          {/* Notifications */}
          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Notifications
            </p>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <Checkbox
                checked={notifyFeatures}
                onCheckedChange={v => setNotifyFeatures(v === true)}
              />
              <span className="text-sm">New feature releases</span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <Checkbox
                checked={notifyOffers}
                onCheckedChange={v => setNotifyOffers(v === true)}
              />
              <span className="text-sm">Offers &amp; promotions</span>
            </label>
          </div>

          <Separator />

          {/* Sign out */}
          <div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2"
              style={{ color: 'var(--destructive)' }}
            >
              <i className="fa-light fa-arrow-right-from-bracket text-sm" aria-hidden="true" />
              Sign out
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
