"use client";

import * as React from "react";
import { CareerCard } from "../shared/career-card";
import { useIsMobile } from "../ui/use-mobile";
import {
  CAROUSEL_GAP,
  SCROLL_CAROUSEL_CLASSES,
  SCROLL_CAROUSEL_INNER_CLASSES,
  ScrollCarouselButtons,
} from "../shared/scroll-carousel";

const CAREER_ARTICLES = [
  {
    id: "1",
    imageSrc: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=400&h=200&fit=crop",
    imageAlt: "Healthcare team collaboration and clinical skills",
    publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    title: "Top 5 Skills Employers Want from Students in 2025",
    readTime: "5m read",
  },
  {
    id: "2",
    imageSrc: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400&h=200&fit=crop",
    imageAlt: "Resume and documents for healthcare career",
    publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    title: "Building a Resume That Works (Even If You've Never Had a Job)",
    readTime: "5m read",
  },
  {
    id: "3",
    imageSrc: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&h=200&fit=crop",
    imageAlt: "Healthcare professional using technology",
    publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    title: "Creating an Effective Resume with AI Support for First-Time Job Seekers",
    readTime: "5m read",
  },
  {
    id: "4",
    imageSrc: "https://images.unsplash.com/photo-1551076805-e1869033e561?w=400&h=200&fit=crop",
    imageAlt: "Clinical setting and healthcare interview",
    publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    title: "How to Ace Your First Clinical Interview: Tips from Hiring Managers",
    readTime: "4m read",
  },
  {
    id: "5",
    imageSrc: "https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=400&h=200&fit=crop",
    imageAlt: "Healthcare professionals networking",
    publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    title: "Networking as a Student: Building Connections Before You Graduate",
    readTime: "6m read",
  },
  {
    id: "6",
    imageSrc: "https://images.unsplash.com/photo-1584515933487-df8f2c2dc862?w=400&h=200&fit=crop",
    imageAlt: "Healthcare professional in clinical setting",
    publishedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    title: "Salary Negotiation 101: Know Your Worth Before Accepting an Offer",
    readTime: "7m read",
  },
] as const;

const CARD_WIDTH = 260;
const SCROLL_AMOUNT = CARD_WIDTH + CAROUSEL_GAP;

export function HomeCareerSection() {
  const isMobile = useIsMobile();
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(true);

  const updateScrollButtons = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  React.useEffect(() => {
    updateScrollButtons();
  }, []);

  return (
    <div className="flex flex-col gap-4">
      {/* Header: title + arrows on same row */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base md:text-lg font-bold">Let&apos;s talk career</h3>
          <p className="text-muted-foreground mt-0.5 text-sm md:text-base">Career tips and articles for students</p>
        </div>
        <ScrollCarouselButtons
          canScrollLeft={canScrollLeft}
          canScrollRight={canScrollRight}
          onScrollLeft={() => {
            scrollRef.current?.scrollBy({ left: -SCROLL_AMOUNT, behavior: "smooth" });
          }}
          onScrollRight={() => {
            scrollRef.current?.scrollBy({ left: SCROLL_AMOUNT, behavior: "smooth" });
          }}
          isMobile={isMobile}
        />
      </div>

      {/* Card row — aligns with section title, overflows to page right edge */}
      <div
        className=""
        style={{ width: "calc(50vw + 50%)", marginLeft: 0 }}
      >
        <div
          ref={scrollRef}
          className={SCROLL_CAROUSEL_CLASSES}
          onScroll={updateScrollButtons}
        >
          <div
            className={SCROLL_CAROUSEL_INNER_CLASSES}
            style={{ gap: CAROUSEL_GAP }}
          >
            {CAREER_ARTICLES.map((article) => (
              <div
                key={article.id}
                className="snap-start shrink-0 flex flex-col"
                style={{ width: CARD_WIDTH, minWidth: CARD_WIDTH }}
              >
                <CareerCard
                  imageSrc={article.imageSrc}
                  imageAlt={article.imageAlt}
                  title={article.title}
                  readTime={article.readTime}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
