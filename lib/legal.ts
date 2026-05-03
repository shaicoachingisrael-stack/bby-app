// Public URLs for legal pages (hosted on GitHub Pages /docs).
// Update LEGAL_BASE if you change the host (Vercel, Netlify, Cloudflare Pages…).
const LEGAL_BASE = 'https://shaicoachingisrael-stack.github.io/bby-app';

export const LEGAL_URLS = {
  index: `${LEGAL_BASE}/`,
  privacy: `${LEGAL_BASE}/privacy.html`,
  terms: `${LEGAL_BASE}/terms.html`,
} as const;
