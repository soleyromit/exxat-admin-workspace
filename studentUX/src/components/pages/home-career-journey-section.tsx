"use client";

import * as React from "react";
/**
 * Career journey message section — "We're here for you on your career journey."
 * Implements Figma design node 116:19087.
 * @param compact — When true, uses smaller margins (e.g. for jobs discover with disclaimer below)
 */
export function HomeCareerJourneySection({ compact }: { compact?: boolean }) {
  return (
    <section
      className="flex flex-col gap-2 items-start justify-end w-full"
      style={{
        marginTop: compact ? "var(--spacing-career-journey-y-compact)" : "var(--spacing-career-journey-y)",
        marginBottom: compact ? "var(--spacing-career-journey-y-compact)" : "var(--spacing-career-journey-y)",
      }}
      aria-labelledby="career-journey-heading"
    >
      <h2
        id="career-journey-heading"
        className="text-journey-headline font-display font-display-light leading-tight tracking-tight max-w-[900px]"
      >
        We&apos;re here for you on
        <br />
        your career journey.
      </h2>
    </section>
  );
}
