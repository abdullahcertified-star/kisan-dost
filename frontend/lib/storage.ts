/**
 * Safe local and session storage helper for Next.js (SSR safe & private mode resilient).
 * Automatically handles JSON parsing, fallback defaults, and avoids hydration mismatches.
 */

export function loadSavedItem<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const item = window.localStorage.getItem(key);
    if (item !== null && item !== undefined && item !== 'undefined') {
      return JSON.parse(item);
    }
    const sessionItem = window.sessionStorage.getItem(key);
    if (sessionItem !== null && sessionItem !== undefined && sessionItem !== 'undefined') {
      return JSON.parse(sessionItem);
    }
  } catch (e) {
    console.warn(`[KisanDost Storage] Error reading ${key}:`, e);
  }
  return fallback;
}

export function saveItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    const serialized = JSON.stringify(value);
    window.localStorage.setItem(key, serialized);
    window.sessionStorage.setItem(key, serialized);
  } catch {
    // Gracefully handle storage quota or private browsing mode
  }
}

export function clearItem(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(key);
    window.sessionStorage.removeItem(key);
  } catch {}
}
