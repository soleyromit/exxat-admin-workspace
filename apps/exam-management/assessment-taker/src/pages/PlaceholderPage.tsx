/**
 * PlaceholderPage — used for sidebar destinations that exist as nav items
 * but whose detailed surface is queued (Past Assessments, Study Resources,
 * Settings, Get Help). Each renders a labeled "what this will be" panel so
 * Aarti / faculty reviewers see the navigation works end-to-end.
 */

import { Link } from 'react-router-dom';
import { Button, Card, CardContent } from '@exxat/ds/packages/ui/src';

interface PlaceholderProps {
  icon: string;
  title: string;
  blurb: string;
  bullets: string[];
  cta?: { label: string; to: string };
}

export function PlaceholderPage({ icon, title, blurb, bullets, cta }: PlaceholderProps) {
  return (
    <div className="flex flex-1 items-start justify-center px-6 py-10">
      <div className="w-full max-w-xl">
        <Card className="p-0">
          <CardContent className="p-8 flex flex-col gap-4">
            <span
              className="flex size-12 items-center justify-center rounded-xl"
              style={{
                backgroundColor: 'color-mix(in oklch, var(--brand-color) 12%, var(--background))',
                color: 'var(--brand-color)',
              }}
            >
              <i className={`fa-light ${icon}`} aria-hidden="true" style={{ fontSize: 22 }} />
            </span>

            <div>
              <h1 className="text-2xl font-semibold text-foreground tracking-tight">{title}</h1>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{blurb}</p>
            </div>

            <ul className="flex flex-col gap-2 mt-1">
              {bullets.map((b, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                  <i className="fa-light fa-circle-check mt-1 shrink-0" aria-hidden="true" style={{ fontSize: 11, color: 'var(--brand-color)' }} />
                  <span>{b}</span>
                </li>
              ))}
            </ul>

            <div className="flex items-center gap-2 mt-2">
              {cta && (
                <Button asChild variant="default" size="sm">
                  <Link to={cta.to}>{cta.label}</Link>
                </Button>
              )}
              <Button asChild variant="ghost" size="sm">
                <Link to="/">Back to Dashboard</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export const HistoryPage = () => (
  <PlaceholderPage
    icon="fa-clock-rotate-left"
    title="Past Assessments"
    blurb="Your full assessment history with score breakdowns, rationale review, and re-take eligibility."
    bullets={[
      'All previously published assessments — sortable by course, score, or date',
      'Per-question correctness with rationales (when faculty has shared them)',
      'Compared against the cohort average so you know where you stood',
    ]}
    cta={{ label: 'View competency progress', to: '/competency' }}
  />
);

export const ResourcesPage = () => (
  <PlaceholderPage
    icon="fa-book-open"
    title="Study Resources"
    blurb="Faculty-curated practice questions, explainer notes, and review modules for the topics you're weakest on."
    bullets={[
      'Practice question packs assigned by your course coordinator',
      'AI-generated review prompts based on your competency gaps',
      'Linked rationales and reference material from past assessments',
    ]}
    cta={{ label: 'See where I’m weakest', to: '/competency' }}
  />
);

export const SettingsPage = () => (
  <PlaceholderPage
    icon="fa-gear"
    title="Settings"
    blurb="Personal preferences for your exam-taking experience."
    bullets={[
      'Accessibility — text size, contrast, and screen-reader behavior',
      'Notifications — opt in/out per channel (email, in-app, SMS)',
      'Privacy — what your faculty can see about your study patterns',
    ]}
  />
);

export const HelpPage = () => (
  <PlaceholderPage
    icon="fa-circle-question"
    title="Get Help"
    blurb="Get unstuck — contact your program, see common how-tos, or message support."
    bullets={[
      'Contact your program coordinator',
      'Common how-tos: technical checks, accommodations, exam navigation',
      'Direct line to Exxat Support during exam windows',
    ]}
  />
);
