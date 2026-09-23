export interface SpinnerProps {
  label?: string;
  size?: "sm" | "md";
}

export function Spinner({ label = "Loading", size = "md" }: SpinnerProps) {
  const dimension = size === "sm" ? "size-4 border-2" : "size-5 border-[2.5px]";

  return (
    <span
      aria-label={label}
      role="status"
      className={`inline-block animate-spin rounded-full border-current border-r-transparent motion-reduce:animate-none ${dimension}`}
    />
  );
}
