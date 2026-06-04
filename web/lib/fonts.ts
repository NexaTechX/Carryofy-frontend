import { Hanken_Grotesk, Bricolage_Grotesque, DM_Mono } from 'next/font/google';

/**
 * Body / UI typeface — Hanken Grotesk. A refined, slightly warm grotesque that
 * stays legible at small dashboard sizes; a deliberate step up from the previous
 * Source Sans (and far from the generic Inter/Roboto defaults).
 */
export const hankenGrotesk = Hanken_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-sans-next',
});

/**
 * Display / heading typeface — Bricolage Grotesque. Characterful, modern, with
 * tight tracking; gives headings and big numbers a distinctive, branded voice.
 */
export const bricolageGrotesque = Bricolage_Grotesque({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-display-next',
});

/** Mono — DM Mono, for tabular figures / code / IDs. */
export const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-mono-next',
});

export const fontClassNames = `${hankenGrotesk.variable} ${bricolageGrotesque.variable} ${dmMono.variable} ${hankenGrotesk.className}`;
