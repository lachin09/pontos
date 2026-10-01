import { MapPin } from "lucide-react";
import type { ReactNode } from "react";

/** The showroom address, opening the map in a new tab. */
export function AddressLink({
  address,
  href,
  label,
  className,
  iconClassName,
  children,
}: {
  address: string;
  href: string;
  /** Accessible hint such as "Open in maps". */
  label: string;
  className?: string;
  iconClassName?: string;
  children?: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={label}
      className={className}
    >
      <MapPin size={14} className={iconClassName} aria-hidden="true" />
      <span>{address}</span>
      {children}
    </a>
  );
}
