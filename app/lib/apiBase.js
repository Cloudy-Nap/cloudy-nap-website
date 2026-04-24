/**
 * Public API origin (Express). Override in .env.local:
 *   NEXT_PUBLIC_API_URL=http://localhost:3001
 *
 * In local dev, if unset, defaults to same-origin (empty string) so requests go to
 * Next.js and are rewritten to Express (see next.config.mjs `rewrites`).
 */
const trimTrailingSlash = (value) =>
  typeof value === 'string' ? value.replace(/\/$/, '') : '';

const fromEnv =
  typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_URL
    ? trimTrailingSlash(process.env.NEXT_PUBLIC_API_URL)
    : '';

export const API_BASE =
  fromEnv ||
  (typeof process !== 'undefined' && process.env.NODE_ENV === 'development'
    ? ''
    : 'https://hitek-server.onrender.com');
