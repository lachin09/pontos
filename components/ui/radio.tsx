import type { InputHTMLAttributes, ReactNode } from "react";

export interface RadioProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "id" | "type"
> {
  id: string;
  label: ReactNode;
  description?: string;
}

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
      className={`flex w-fit items-start gap-3 text-sm ${className}`}
    >
      <input
        id={id}
        type="radio"
        className="mt-0.5 size-4 accent-accent focus-visible:outline-focus"
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
