import type { InputHTMLAttributes, ReactNode } from "react";

export interface CheckboxProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "id" | "type"
> {
  id: string;
  label: ReactNode;
  description?: string;
}

export function Checkbox({
  id,
  label,
  description,
  className = "",
  ...props
}: CheckboxProps) {
  return (
    <label
      htmlFor={id}
      className={`flex w-fit items-start gap-3 text-sm ${className}`}
    >
      <input
        id={id}
        type="checkbox"
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
