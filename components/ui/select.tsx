import type { ReactNode, SelectHTMLAttributes } from "react";

export interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  "id"
> {
  id: string;
  label: ReactNode;
  options: SelectOption[];
  placeholder?: string;
  hint?: string;
  error?: string;
}

export function Select({
  id,
  label,
  options,
  placeholder,
  hint,
  error,
  className = "",
  ...props
}: SelectProps) {
  const helpId = hint || error ? `${id}-help` : undefined;

  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>
      <select
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={helpId}
        className={`min-h-11 w-full rounded-[var(--radius-control)] border border-border bg-surface px-3.5 text-base text-foreground sm:text-sm transition-[border-color,box-shadow] hover:border-muted/60 focus:border-focus focus:outline-none focus:ring-4 focus:ring-focus/15 ${error ? "border-danger" : ""} ${className}`}
        {...props}
      >
        {placeholder ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : null}
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
      {error ? (
        <p id={helpId} className="text-xs text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={helpId} className="text-xs text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
