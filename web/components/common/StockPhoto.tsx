import Image, { type ImageProps } from 'next/image';

/** Loads Unsplash/stock URLs in the browser — avoids Next.js upstream fetch timeouts. */
export default function StockPhoto(props: ImageProps) {
  return <Image {...props} unoptimized />;
}
