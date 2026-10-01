"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { buttonClasses } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/client";
import { fill } from "@/lib/i18n/dictionaries";

export interface HeroSlide {
  id: string;
  imageUrl: string;
  name: string;
  price: string;
  href: string;
}

const SLIDE_MS = 6000;
const SWIPE_PX = 40;

export function HeroSlider({ slides }: { slides: HeroSlide[] }) {
  const { t, href } = useI18n();
  const s = t.home.slider;
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const count = slides.length;

  // Photos are fetched only for slides that have been shown plus the next
  // one, so the first paint is not waiting on five large images.
  const [shown, setShown] = useState<Set<number>>(() => new Set([0, 1]));

  const go = useCallback(
    (index: number) => {
      const target = ((index % count) + count) % count;
      setActive(target);
      setShown((current) =>
        current.has(target) && current.has((target + 1) % count)
          ? current
          : new Set([...current, target, (target + 1) % count]),
      );
    },
    [count],
  );

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  const playing = count > 1 && !paused && !hovered && !reducedMotion;

  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(() => go(active + 1), SLIDE_MS);
    return () => window.clearTimeout(timer);
  }, [playing, active, go]);

  if (count === 0) return null;
  const current = slides[active];

  return (
    <section
      aria-roledescription={s.carousel}
      aria-label={s.label}
      className="relative isolate overflow-hidden bg-photo text-foreground"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) {
          setHovered(false);
        }
      }}
      onTouchStart={(event) => {
        touchStartX.current = event.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(event) => {
        const start = touchStartX.current;
        const end = event.changedTouches[0]?.clientX;
        touchStartX.current = null;
        if (start === null || end === undefined) return;
        if (Math.abs(end - start) < SWIPE_PX) return;
        go(end < start ? active + 1 : active - 1);
      }}
    >
      <div className="relative aspect-[3/4] max-h-[88vh] min-h-[560px] w-full sm:aspect-[16/10] sm:min-h-0 lg:aspect-auto lg:h-[min(76vh,760px)] lg:min-h-[560px]">
        {slides.map((slide, index) => {
          const isActive = index === active;
          return (
            <div
              key={slide.id}
              role="group"
              aria-roledescription={s.slide}
              aria-label={fill(s.slideLabel, {
                index: index + 1,
                total: count,
                name: slide.name,
              })}
              aria-hidden={!isActive}
              className={`absolute inset-0 transition-opacity duration-1000 ease-out ${isActive ? "opacity-100" : "opacity-0"}`}
            >
              {shown.has(index) ? (
                /* Product photos sit on the same warm grey as this section,
                   so the garment appears to float in the hero. */
                <div className="absolute inset-x-0 top-0 h-[54%] overflow-hidden sm:inset-0 sm:left-[38%] sm:h-auto lg:left-[44%] lg:right-[4%]">
                  <Image
                    src={slide.imageUrl}
                    alt={slide.name}
                    fill
                    sizes="(max-width: 640px) 100vw, 60vw"
                    preload={index === 0}
                    className={`object-contain ${isActive && !reducedMotion ? "animate-hero-zoom" : ""}`}
                  />
                </div>
              ) : null}
            </div>
          );
        })}

        <div className="absolute inset-0 flex items-end sm:items-center">
          <div className="mx-auto w-full max-w-[1440px] px-page pb-24 sm:pb-0">
            <div className="max-w-xl">
              <p className="eyebrow flex items-center gap-3 text-gold">
                <span className="h-px w-10 bg-gold/70" aria-hidden="true" />
                {s.eyebrow}
              </p>
              <h1 className="mt-4 text-[clamp(3.25rem,8vw,7rem)] leading-[0.92] text-foreground">
                {s.title}
              </h1>
              <p className="mt-5 hidden max-w-md text-sm leading-7 text-muted sm:block sm:text-base">
                {s.text}
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3 sm:mt-8">
                <Link
                  href={href("/catalog")}
                  className={buttonClasses({
                    size: "lg",
                    className:
                      "group/cta bg-ink text-white hover:bg-gold hover:text-white",
                  })}
                >
                  {s.cta}
                  <ArrowRight
                    size={16}
                    className="transition-transform group-hover/cta:translate-x-0.5"
                    aria-hidden="true"
                  />
                </Link>
                <Link
                  href={href("/catalog?sort=newest")}
                  className={buttonClasses({
                    variant: "outline",
                    size: "lg",
                    className:
                      "border-ink/30 text-foreground hover:border-ink hover:bg-ink/5",
                  })}
                >
                  {s.newIn}
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Current model and slider controls. */}
        <div className="absolute inset-x-0 bottom-0">
          <div className="mx-auto flex max-w-[1440px] items-end justify-between gap-4 px-page pb-6 sm:pb-8">
            <Link
              key={current.id}
              href={current.href}
              className="group/model hidden min-w-0 animate-fade-in sm:block"
            >
              <span className="block text-[0.6rem] uppercase tracking-[0.22em] text-muted">
                {s.onPhoto}
              </span>
              <span className="mt-1 block truncate font-serif text-xl text-foreground transition-colors group-hover/model:text-gold">
                {current.name}
              </span>
              <span className="mt-0.5 flex items-center gap-2 text-sm text-muted">
                {current.price}
                <ArrowRight
                  size={14}
                  className="transition-transform group-hover/model:translate-x-0.5"
                  aria-hidden="true"
                />
              </span>
            </Link>

            {count > 1 ? (
              <div className="flex items-center gap-3 sm:ml-auto sm:gap-4">
                <div className="flex items-center gap-2">
                  {slides.map((slide, index) => (
                    <button
                      key={slide.id}
                      type="button"
                      aria-label={fill(s.showSlide, {
                        index: index + 1,
                        name: slide.name,
                      })}
                      aria-current={index === active ? "true" : undefined}
                      onClick={() => go(index)}
                      className="group/dot relative grid h-8 w-7 place-items-center sm:w-10"
                    >
                      <span className="relative block h-0.5 w-full overflow-hidden bg-ink/20">
                        {index === active ? (
                          <span
                            key={`${active}-${playing}`}
                            className={`absolute inset-y-0 left-0 bg-gold ${playing ? "animate-hero-progress" : "w-full"}`}
                            style={
                              playing
                                ? { animationDuration: `${SLIDE_MS}ms` }
                                : undefined
                            }
                          />
                        ) : null}
                      </span>
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    aria-label={s.previous}
                    onClick={() => go(active - 1)}
                    className="hidden size-10 place-items-center rounded-full border border-ink/25 transition-colors hover:border-ink hover:bg-ink/5 sm:grid"
                  >
                    <ChevronLeft size={18} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    aria-label={s.next}
                    onClick={() => go(active + 1)}
                    className="hidden size-10 place-items-center rounded-full border border-ink/25 transition-colors hover:border-ink hover:bg-ink/5 sm:grid"
                  >
                    <ChevronRight size={18} aria-hidden="true" />
                  </button>
                  {!reducedMotion ? (
                    <button
                      type="button"
                      aria-label={paused ? s.resume : s.pause}
                      aria-pressed={paused}
                      onClick={() => setPaused((value) => !value)}
                      className="grid size-10 place-items-center rounded-full text-muted transition-colors hover:text-foreground"
                    >
                      {paused ? (
                        <Play size={15} aria-hidden="true" />
                      ) : (
                        <Pause size={15} aria-hidden="true" />
                      )}
                    </button>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
      <p className="sr-only" aria-live={playing ? "off" : "polite"}>
        {fill(s.status, {
          index: active + 1,
          total: count,
          name: current.name,
        })}
      </p>
    </section>
  );
}
