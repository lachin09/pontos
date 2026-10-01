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
 * own background. The blurred layer asks for a tiny (16px) rendition, which
 * arrives in a few milliseconds and doubles as a placeholder while the
 * sharp photo loads.
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
        sizes="16px"
        quality={30}
        preload={preload}
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
