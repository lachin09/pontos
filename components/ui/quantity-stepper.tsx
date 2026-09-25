import { Minus, Plus } from "lucide-react";

const sizeClasses = {
  md: {
    root: "h-10 rounded-full",
    button: "size-10 rounded-full transition-colors",
    output: "min-w-6",
    icon: 14,
  },
  lg: {
    root: "h-12 rounded-[var(--radius-control)]",
    button: "size-11",
    output: "min-w-7",
    icon: 15,
  },
} as const;

export interface QuantityStepperProps {
  value: number;
  onDecrease: () => void;
  onIncrease: () => void;
  canDecrease: boolean;
  canIncrease: boolean;
  /** Appended to the button labels, e.g. the product name in a cart line. */
  itemName?: string;
  size?: keyof typeof sizeClasses;
}

export function QuantityStepper({
  value,
  onDecrease,
  onIncrease,
  canDecrease,
  canIncrease,
  itemName,
  size = "lg",
}: QuantityStepperProps) {
  const styles = sizeClasses[size];
  const suffix = itemName ? ` ${itemName}` : "";

  return (
    <div
      className={`inline-flex items-center border border-border bg-surface ${styles.root}`}
    >
      <button
        type="button"
        aria-label={`Зменшити кількість${suffix}`}
        onClick={onDecrease}
        disabled={!canDecrease}
        className={`grid place-items-center text-foreground hover:text-accent disabled:opacity-40 ${styles.button}`}
      >
        <Minus size={styles.icon} aria-hidden="true" />
      </button>
      <output
        aria-label="Кількість"
        className={`text-center text-sm tabular-nums ${styles.output}`}
      >
        {value}
      </output>
      <button
        type="button"
        aria-label={`Збільшити кількість${suffix}`}
        onClick={onIncrease}
        disabled={!canIncrease}
        className={`grid place-items-center text-foreground hover:text-accent disabled:opacity-40 ${styles.button}`}
      >
        <Plus size={styles.icon} aria-hidden="true" />
      </button>
    </div>
  );
}
