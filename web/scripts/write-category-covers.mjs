/**
 * Writes local SVG category cover art to public/category-covers/
 * Run: node scripts/write-category-covers.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '..', 'public', 'category-covers');

const categories = [
  { file: 'electronics', from: '#1d4ed8', to: '#0f172a', accent: '#93c5fd' },
  { file: 'fashion', from: '#be185d', to: '#500724', accent: '#f9a8d4' },
  { file: 'home', from: '#b45309', to: '#451a03', accent: '#fcd34d' },
  { file: 'toys', from: '#7c3aed', to: '#2e1065', accent: '#c4b5fd' },
  { file: 'beauty', from: '#db2777', to: '#831843', accent: '#fbcfe8' },
  { file: 'health', from: '#059669', to: '#064e3b', accent: '#6ee7b7' },
  { file: 'sports', from: '#ea580c', to: '#7c2d12', accent: '#fdba74' },
  { file: 'pet', from: '#0d9488', to: '#134e4a', accent: '#5eead4' },
  { file: 'automotive', from: '#475569', to: '#0f172a', accent: '#cbd5e1' },
  { file: 'grocery', from: '#ca8a04', to: '#713f12', accent: '#fde047' },
  { file: 'office', from: '#4f46e5', to: '#1e1b4b', accent: '#a5b4fc' },
  { file: 'baby', from: '#f472b6', to: '#9d174d', accent: '#fce7f3' },
  { file: 'jewelry', from: '#a16207', to: '#422006', accent: '#fde68a' },
  { file: 'watches', from: '#334155', to: '#020617', accent: '#94a3b8' },
  { file: 'computers', from: '#0284c7', to: '#082f49', accent: '#7dd3fc' },
  { file: 'default', from: '#ea580c', to: '#431407', accent: '#fdba74' },
];

function svg({ file, from, to, accent }) {
  const label = file.replace(/-/g, ' ');
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" role="img" aria-label="${label}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${from}"/>
      <stop offset="100%" stop-color="${to}"/>
    </linearGradient>
    <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
      <path d="M 32 0 L 0 0 0 32" fill="none" stroke="${accent}" stroke-width="0.5" opacity="0.12"/>
    </pattern>
  </defs>
  <rect width="400" height="500" fill="url(#bg)"/>
  <rect width="400" height="500" fill="url(#grid)"/>
  <circle cx="340" cy="70" r="110" fill="#ffffff" opacity="0.07"/>
  <circle cx="70" cy="430" r="95" fill="#ffffff" opacity="0.05"/>
  <rect x="28" y="380" width="140" height="4" rx="2" fill="${accent}" opacity="0.55"/>
  <rect x="28" y="396" width="96" height="4" rx="2" fill="#ffffff" opacity="0.25"/>
</svg>
`;
}

fs.mkdirSync(outDir, { recursive: true });
for (const cat of categories) {
  fs.writeFileSync(path.join(outDir, `${cat.file}.svg`), svg(cat), 'utf8');
}
console.log(`Wrote ${categories.length} covers to ${outDir}`);
