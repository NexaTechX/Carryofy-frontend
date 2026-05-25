import Image from 'next/image';

type RemoteImageProps = {
  src: string;
  alt: string;
  className?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  priority?: boolean;
};

/** Product/media URLs from API (e.g. Cloudinary). */
export default function RemoteImage({
  src,
  alt,
  className = '',
  fill,
  width,
  height,
  sizes,
  priority,
}: RemoteImageProps) {
  if (!src) return null;

  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        className={className}
        sizes={sizes ?? '(max-width: 768px) 80px, 96px'}
        priority={priority}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width ?? 64}
      height={height ?? 64}
      className={className}
      sizes={sizes}
      priority={priority}
    />
  );
}
