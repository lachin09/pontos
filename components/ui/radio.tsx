import type { InputHTMLAttributes, ReactNode } from "react";

export interface RadioProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "id" | "type"
> {
  id: string;
  label: ReactNode;
  description?: string;
}

/** A radio option rendered as a selectable card. */
export function Radio({
  id,
  label,
  description,
  className = "",
  ...props
}: RadioProps) {
  return (
    <label
      htmlFor={id}
      className={`flex cursor-pointer items-start gap-3 rounded-[var(--radius-control)] border border-border p-3.5 text-sm transition-colors hover:border-muted has-[:checked]:border-accent has-[:checked]:bg-accent/5 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus ${className}`}
    >
      <input
        id={id}
        type="radio"
        className="mt-0.5 size-4 shrink-0 accent-accent focus-visible:outline-none"
        aria-describedby={description ? `${id}-description` : undefined}
        {...props}
      />
      <span className="grid gap-0.5">
        <span className="font-medium text-foreground">{label}</span>
        {description ? (
          <span id={`${id}-description`} className="text-xs text-muted">
            {description}
          </span>
        ) : null}
      </span>
    </label>
  );
}
