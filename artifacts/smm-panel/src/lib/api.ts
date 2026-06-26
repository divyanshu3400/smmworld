/**
 * API base URL.
 *
 * Development (Replit):  VITE_API_URL is unset → empty string → relative paths
 *                        e.g. fetch('/api/public/stats') hits the same domain
 *
 * Production (Railway):  Set VITE_API_URL=https://your-api.railway.app
 *                        e.g. fetch('https://your-api.railway.app/api/public/stats')
 */
export const API_BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

export function apiUrl(path: string): string {
  return `${API_BASE}${path}`
}
