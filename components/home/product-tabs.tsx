"use client";

import { useId, useState, type ReactNode } from "react";

/**
 * Switches between product grids that the server already rendered, so the
 * client only toggles visibility and never re-renders the cards.
 */
export function ProductTabs({
  tabs,
}: {
  tabs: { id: string; label: string; panel: ReactNode }[];
}) {
  const [active, setActive] = useState(tabs[0]?.id);
  const baseId = useId();

  return (
    <div>
      <div
        role="tablist"
        aria-label="Добірки товарів"
        className="mb-10 flex justify-center gap-8"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`${baseId}-${tab.id}-tab`}
            aria-controls={`${baseId}-${tab.id}-panel`}
            aria-selected={active === tab.id}
            onClick={() => setActive(tab.id)}
            className="border-b border-transparent pb-1.5 font-serif text-xl text-muted transition-colors hover:text-foreground aria-selected:border-gold aria-selected:text-foreground sm:text-2xl"
          >
            {tab.label}
          </button>
        ))}
      </div>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`${baseId}-${tab.id}-panel`}
          aria-labelledby={`${baseId}-${tab.id}-tab`}
          hidden={active !== tab.id}
        >
          {tab.panel}
        </div>
      ))}
    </div>
  );
}
