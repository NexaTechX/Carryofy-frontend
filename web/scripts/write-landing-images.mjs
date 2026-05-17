/**
 * Landing / placeholder SVG assets (always available offline)
 * Run: node scripts/write-landing-images.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const landingDir = path.join(__dirname, '..', 'public', 'images', 'landing');
const placeholdersDir = path.join(__dirname, '..', 'public', 'images', 'placeholders');

const heroSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" role="img" aria-hidden="true">
  <defs>
    <linearGradient id="h" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fafaf9"/>
      <stop offset="45%" stop-color="#f5f5f4"/>
      <stop offset="100%" stop-color="#e7e5e4"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#ff6b00" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="#ff6b00" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="1600" height="900" fill="url(#h)"/>
  <rect width="1600" height="900" fill="url(#accent)"/>
  <g opacity="0.35" fill="#78716c">
    <rect x="980" y="120" width="480" height="320" rx="12"/>
    <rect x="1020" y="160" width="180" height="140" rx="8" fill="#a8a29e"/>
    <rect x="1220" y="160" width="200" height="64" rx="6" fill="#d6d3d1"/>
    <rect x="1220" y="240" width="160" height="48" rx="6" fill="#d6d3d1"/>
    <rect x="1020" y="320" width="400" height="88" rx="8" fill="#a8a29e"/>
    <rect x="1040" y="480" width="120" height="200" rx="8"/>
    <rect x="1180" y="480" width="120" height="200" rx="8"/>
    <rect x="1320" y="480" width="120" height="200" rx="8"/>
  </g>
</svg>`;

const ctaSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 600" role="img" aria-hidden="true">
  <defs>
    <linearGradient id="c" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#18181b"/>
      <stop offset="100%" stop-color="#27272a"/>
    </linearGradient>
  </defs>
  <rect width="1600" height="600" fill="url(#c)"/>
  <circle cx="200" cy="100" r="180" fill="#ff6b00" opacity="0.08"/>
  <circle cx="1400" cy="500" r="220" fill="#ff6b00" opacity="0.06"/>
</svg>`;

const productPlaceholder = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" role="img" aria-label="Product">
  <rect width="400" height="400" fill="#f4f4f5"/>
  <rect x="80" y="100" width="240" height="180" rx="12" fill="#e4e4e7"/>
  <rect x="120" y="300" width="160" height="16" rx="4" fill="#d4d4d8"/>
  <rect x="140" y="330" width="120" height="12" rx="4" fill="#e4e4e7"/>
</svg>`;

fs.mkdirSync(landingDir, { recursive: true });
fs.mkdirSync(placeholdersDir, { recursive: true });
fs.writeFileSync(path.join(landingDir, 'hero-marketplace.svg'), heroSvg, 'utf8');
fs.writeFileSync(path.join(landingDir, 'cta-wholesale.svg'), ctaSvg, 'utf8');
fs.writeFileSync(path.join(placeholdersDir, 'product.svg'), productPlaceholder, 'utf8');
console.log('Wrote landing + placeholder images');
