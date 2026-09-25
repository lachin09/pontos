import Image, { type ImageProps } from "next/image";

type ProductPhotoProps = Omit<ImageProps, "fill" | "src" | "alt"> & {
  src: string;
  alt: string;
  sizes: string;
  /** Classes for the contained (sharp) image, e.g. hover transitions. */
  imageClassName?: string;
};

/**
 * Shows a whole product photo inside a fixed-ratio frame, whatever the
 * photo's own proportions. Product shots arrive as squares, 2:3 and 3:4
 * portraits; `object-cover` would crop collars and hems off tall photos and
 * make them look zoomed in next to square packshots. The spare space is
 * filled with a blurred copy of the same photo so it blends with the photo's
 * own background. Both layers use the same src and sizes, so the browser
 * downloads the file once.
 *
 * Render inside a `relative` element that sets the aspect ratio.
 */
export function ProductPhoto({
  src,
  alt,
  sizes,
  className = "",
  imageClassName = "",
  preload,
  ...props
}: ProductPhotoProps) {
  return (
    <span className={`absolute inset-0 overflow-hidden ${className}`}>
      <Image
        src={src}
        alt=""
        aria-hidden="true"
        fill
        sizes={sizes}
        {...props}
        className="scale-110 object-cover opacity-80 blur-2xl saturate-[0.85]"
      />
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        preload={preload}
        {...props}
        className={`object-contain ${imageClassName}`}
      />
    </span>
  );
}
