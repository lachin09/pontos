import { Check } from "lucide-react";

const STEPS = ["Кошик", "Дані", "Підтвердження"] as const;

/** Progress indicator; `current` is the 0-based active step (3 = all done). */
export function CheckoutSteps({ current }: { current: number }) {
  return (
    <ol className="mt-5 flex items-center gap-2 text-xs sm:gap-3 sm:text-sm">
      {STEPS.map((step, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <li key={step} className="flex items-center gap-2 sm:gap-3">
            {index > 0 ? (
              <span
                className={`h-px w-4 sm:w-8 ${done || active ? "bg-accent" : "bg-border"}`}
                aria-hidden="true"
              />
            ) : null}
            <span
              aria-current={active ? "step" : undefined}
              className={`flex items-center gap-1.5 ${active ? "font-semibold text-foreground" : done ? "text-accent" : "text-muted"}`}
            >
              <span
                className={`grid size-5 place-items-center rounded-full text-[0.65rem] ${done ? "bg-accent text-white" : active ? "bg-foreground text-background" : "border border-border"}`}
                aria-hidden="true"
              >
                {done ? <Check size={12} /> : index + 1}
              </span>
              {step}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
