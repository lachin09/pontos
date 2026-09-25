"use client";

import { useEffect, useState, type RefObject } from "react";

/** True while the referenced element is scrolled out of the viewport. */
export function useIsOffscreen(ref: RefObject<HTMLElement | null>) {
  const [offscreen, setOffscreen] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) =>
      setOffscreen(!entry.isIntersecting),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);

  return offscreen;
}
