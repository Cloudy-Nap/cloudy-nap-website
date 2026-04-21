/**
 * Public API origin (Express). Override locally in .env.local:
 *   NEXT_PUBLIC_API_URL=http://localhost:3001
 */
export const API_BASE = (
  typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_URL
    ? process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '')
    : 'https://hitek-server.onrender.com'
);
