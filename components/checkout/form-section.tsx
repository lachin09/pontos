import type { ReactNode } from "react";

function StepNumber({ value }: { value: number }) {
  return (
    <span
      className="grid size-6 place-items-center rounded-full bg-foreground text-xs text-background"
      aria-hidden="true"
    >
      {value}
    </span>
  );
}

/** A numbered checkout card. `asFieldset` for groups of radio options. */
export function FormSection({
  id,
  step,
  title,
  asFieldset = false,
  children,
}: {
  id: string;
  step: number;
  title: string;
  asFieldset?: boolean;
  children: ReactNode;
}) {
  if (asFieldset) {
    return (
      <fieldset className="grid gap-4 rounded-[var(--radius-card)] border border-border bg-surface p-5 sm:p-6">
        <legend className="float-left mb-1 flex w-full items-center gap-2.5 text-lg font-medium">
          <StepNumber value={step} />
          {title}
        </legend>
        {children}
      </fieldset>
    );
  }
  return (
    <section
      className="grid gap-4 rounded-[var(--radius-card)] border border-border bg-surface p-5 sm:grid-cols-2 sm:p-6"
      aria-labelledby={id}
    >
      <h2
        id={id}
        className="flex items-center gap-2.5 text-lg font-medium sm:col-span-2"
      >
        <StepNumber value={step} />
        {title}
      </h2>
      {children}
    </section>
  );
}
