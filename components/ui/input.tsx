import type { InputHTMLAttributes, ReactNode } from "react";

export interface InputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "id"
> {
  id: string;
  label: ReactNode;
  hint?: string;
  error?: string;
}

export function Input({
  id,
  label,
  hint,
  error,
  className = "",
  ...props
}: InputProps) {
  const helpId = hint || error ? `${id}-help` : undefined;

  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={helpId}
        className={`min-h-11 w-full rounded-[var(--radius-control)] border border-border bg-surface px-3.5 text-base text-foreground sm:text-sm placeholder:text-muted transition-[border-color,box-shadow] hover:border-muted/60 focus:border-focus focus:outline-none focus:ring-4 focus:ring-focus/15 ${error ? "border-danger" : ""} ${className}`}
        {...props}
      />
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
