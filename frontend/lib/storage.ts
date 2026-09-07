/**
 * Safe local and session storage helper for Next.js (SSR safe & private mode resilient).
 * Strictly prevents storage of authentication tokens in client localStorage / document.cookie.
 * Authentication tokens are exclusively handled by server-set HttpOnly, Secure cookies.
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

export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const profile =
      window.localStorage.getItem('kisan_farmer_profile') ||
      window.sessionStorage.getItem('kisan_farmer_profile');
    return Boolean(profile);
  } catch {
    return false;
  }
}

export function setAuthSession(tokenOrProfile: any, maybeProfile?: any): void {
  if (typeof window === 'undefined') return;
  try {
    const profile = maybeProfile || tokenOrProfile;
    saveItem('kisan_farmer_profile', profile);

    // Explicitly wipe any residual authentication tokens from client-accessible storage
    window.localStorage.removeItem('kisan_auth_token');
    window.sessionStorage.removeItem('kisan_auth_token');
  } catch {}
}

export async function clearAuthSession(): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    // 1. Notify server to invalidate serverless token and clear HttpOnly cookie
    try {
      await fetch('/api/logout', { method: 'POST', credentials: 'include' });
    } catch {}

    // 2. Purge user-scoped chat histories and session records from shared devices
    const chatKeysToRemove: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && (k.startsWith('kd_chat_history') || k.startsWith('kd_chat_session'))) {
        chatKeysToRemove.push(k);
      }
    }
    chatKeysToRemove.forEach((k) => {
      window.localStorage.removeItem(k);
      window.sessionStorage.removeItem(k);
    });

    window.localStorage.removeItem('kd_chat_history_v2');
    window.localStorage.removeItem('kd_chat_session_id');
    window.sessionStorage.removeItem('kd_chat_history_v2');
    window.sessionStorage.removeItem('kd_chat_session_id');

    // 3. Clear non-sensitive UI profiles and cached keys
    window.localStorage.removeItem('kisan_auth_token');
    window.localStorage.removeItem('kisan_farmer_profile');
    window.localStorage.removeItem('kd_dashboard_profile');
    window.localStorage.removeItem('kd_custom_gemini_key');
    window.localStorage.removeItem('kd_free_queries_used');
  } catch {}
}
