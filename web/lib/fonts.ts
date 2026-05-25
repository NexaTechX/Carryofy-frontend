import { DM_Mono, Source_Sans_3 } from 'next/font/google';

export const sourceSans = Source_Sans_3({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-sans-next',
});

export const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-mono-next',
});

export const fontClassNames = `${sourceSans.variable} ${dmMono.variable} ${sourceSans.className}`;
