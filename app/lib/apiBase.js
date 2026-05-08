/**
 * Public API origin used by the browser for `/api/*` routes.
 *
 * Local dev (no env): same-origin (`''`) + Next.js rewrites → Express on port 3001.
 *
 * Vercel / production:
 * - Set `NEXT_PUBLIC_API_URL=https://your-api.onrender.com` — Next rewrites `/api/*` there and
 *   this module uses `''` so requests stay same-origin (no CORS).
 * - Optional: `NEXT_PUBLIC_API_DIRECT=1` to call `NEXT_PUBLIC_API_URL` directly from the client.
 *
 * If `NEXT_PUBLIC_API_URL` is unset in production, falls back to Cloudynap Render API (update if you move hosts).
 */
const trimTrailingSlash = (value) =>
  typeof value === 'string' ? value.replace(/\/$/, '') : '';

const CLOUDYNAP_API_FALLBACK = 'https://cloudy-server-2fth.onrender.com';

const backendUrl =
  typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_URL
    ? trimTrailingSlash(process.env.NEXT_PUBLIC_API_URL)
    : '';

const useRelativeApi =
  Boolean(backendUrl) && typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_DIRECT !== '1';

export const API_BASE = useRelativeApi
  ? ''
  : backendUrl ||
    (typeof process !== 'undefined' && process.env.NODE_ENV === 'development'
      ? ''
      : CLOUDYNAP_API_FALLBACK);

/**
 * `new URL(\`${API_BASE}/api/...\`)` throws when API_BASE is "" (relative `/api/...` is invalid alone).
 * Use this helper instead; it uses `window.location.origin` on the client when API_BASE is empty.
 */
export function createApiUrl(path) {
  const pathname = path.startsWith('/') ? path : `/${path}`;
  const pathNoLeading = pathname.replace(/^\//, '');
  const root =
    typeof API_BASE === 'string' && API_BASE.length > 0
      ? trimTrailingSlash(API_BASE)
      : typeof window !== 'undefined' && window.location?.origin
        ? window.location.origin
        : trimTrailingSlash(CLOUDYNAP_API_FALLBACK);
  return new URL(pathNoLeading, `${root}/`);
}
