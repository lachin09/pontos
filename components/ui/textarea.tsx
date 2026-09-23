import type { ReactNode, TextareaHTMLAttributes } from "react";

export interface TextareaProps extends Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  "id"
> {
  id: string;
  label: ReactNode;
  hint?: string;
  error?: string;
}

export function Textarea({
  id,
  label,
  hint,
  error,
  className = "",
  ...props
}: TextareaProps) {
  const helpId = hint || error ? `${id}-help` : undefined;

  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>
      <textarea
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={helpId}
        className={`min-h-28 w-full resize-y rounded-[var(--radius-control)] border border-border bg-surface px-3.5 py-3 text-sm text-foreground placeholder:text-muted focus:border-focus focus:outline-none ${error ? "border-danger" : ""} ${className}`}
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
