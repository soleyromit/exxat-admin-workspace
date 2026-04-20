/**
 * DS Showcase — imported directly from exxat-ds-workspace submodule
 * Source: exxat-ds/packages/ui/src/index.ts
 */
import Link from 'next/link'
import {
  Button,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Input,
  Separator,
} from '@exxat/ds/packages/ui/src'

const DS_PATH = 'exxat-ds/packages/ui/src/index.ts'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <p className="text-xs font-mono" style={{ color: 'var(--muted-foreground)' }}>
        {title}
      </p>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </section>
  )
}

export default function DSShowcasePage() {
  return (
    <div
      className="min-h-screen p-10"
      style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
    >
      {/* Header */}
      <div className="mb-10 flex items-start justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span
              className="rounded px-2 py-0.5 font-mono text-xs"
              style={{ backgroundColor: 'var(--brand-tint)', color: 'var(--brand-color-dark)' }}
            >
              Admin DS
            </span>
            <span style={{ color: 'var(--muted-foreground)' }} className="text-xs font-mono">
              ← exxat-ds/packages/ui/src
            </span>
          </div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
            Exxat DS Workspace — Component Showcase
          </h1>
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            All components on this page are imported from{' '}
            <code
              className="rounded px-1 py-0.5 font-mono text-xs"
              style={{ backgroundColor: 'var(--muted)', color: 'var(--foreground)' }}
            >
              {DS_PATH}
            </code>{' '}
            via the{' '}
            <code
              className="rounded px-1 py-0.5 font-mono text-xs"
              style={{ backgroundColor: 'var(--muted)', color: 'var(--foreground)' }}
            >
              @exxat/ds
            </code>{' '}
            path alias.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/question-bank">
            <i className="fa-light fa-arrow-right" aria-hidden="true" />
            Go to Question Bank
          </Link>
        </Button>
      </div>

      <Separator className="mb-10" />

      <div className="flex flex-col gap-10 max-w-3xl">

        {/* Button */}
        <Section title="Button — import { Button } from '@exxat/ds/packages/ui/src'">
          <Button>Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="link">Link</Button>
          <Button size="sm">Small</Button>
          <Button size="lg">Large</Button>
          <Button size="icon">
            <i className="fa-light fa-plus" aria-hidden="true" />
          </Button>
          <Button disabled>Disabled</Button>
        </Section>

        <Separator />

        {/* Badge */}
        <Section title="Badge — import { Badge } from '@exxat/ds/packages/ui/src'">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="destructive">Destructive</Badge>
          <Badge variant="ghost">Ghost</Badge>
        </Section>

        <Separator />

        {/* Input */}
        <Section title="Input — import { Input } from '@exxat/ds/packages/ui/src'">
          <Input className="w-64" placeholder="Type something…" />
          <Input className="w-64" placeholder="Disabled" disabled />
          <Input className="w-64" placeholder="Invalid" aria-invalid="true" />
        </Section>

        <Separator />

        {/* Card */}
        <section className="flex flex-col gap-3">
          <p className="text-xs font-mono" style={{ color: 'var(--muted-foreground)' }}>
            Card — import &#123; Card, CardHeader, CardTitle, CardDescription, CardContent &#125; from &apos;@exxat/ds/packages/ui/src&apos;
          </p>
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Question Bank</CardTitle>
                <CardDescription>Manage and organize exam questions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Badge>128 questions</Badge>
                  <Badge variant="secondary">12 courses</Badge>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Share Access</CardTitle>
                <CardDescription>Control who can collaborate on your bank</CardDescription>
              </CardHeader>
              <CardContent>
                <Button size="sm">
                  <i className="fa-light fa-user-plus" aria-hidden="true" />
                  Invite faculty
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        <Separator />

        {/* Design tokens */}
        <section className="flex flex-col gap-3">
          <p className="text-xs font-mono" style={{ color: 'var(--muted-foreground)' }}>
            CSS Tokens — from exxat-ds/packages/ui/src/theme.css
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              { label: '--primary', token: 'var(--primary)' },
              { label: '--secondary', token: 'var(--secondary)' },
              { label: '--muted', token: 'var(--muted)' },
              { label: '--accent', token: 'var(--accent)' },
              { label: '--brand-color', token: 'var(--brand-color)' },
              { label: '--brand-tint', token: 'var(--brand-tint)' },
              { label: '--destructive', token: 'var(--destructive)' },
            ].map(({ label, token }) => (
              <div
                key={label}
                className="flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-mono"
                style={{ borderColor: 'var(--border)' }}
              >
                <span
                  className="size-3 rounded-full shrink-0"
                  style={{ backgroundColor: token }}
                />
                {label}
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  )
}
