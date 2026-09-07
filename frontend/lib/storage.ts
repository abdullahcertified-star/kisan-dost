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

export const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes of inactivity

export function recordActivity(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem('kd_last_activity', Date.now().toString());
  } catch {}
}

export function isSessionExpired(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const last = window.localStorage.getItem('kd_last_activity');
    if (!last) return false;
    const elapsed = Date.now() - parseInt(last, 10);
    return elapsed > INACTIVITY_TIMEOUT_MS;
  } catch {
    return false;
  }
}

export function setupInactivityTracker(onTimeout?: () => void): () => void {
  if (typeof window === 'undefined') return () => {};

  // Record initial activity on mount
  recordActivity();

  let lastRecorded = Date.now();
  const THROTTLE_MS = 10000; // Throttle to reduce localStorage writes

  const handleActivity = () => {
    const now = Date.now();
    if (now - lastRecorded >= THROTTLE_MS) {
      lastRecorded = now;
      recordActivity();
    }
  };

  const events: (keyof WindowEventMap)[] = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
  events.forEach((evt) => {
    window.addEventListener(evt, handleActivity, { passive: true });
  });

  const checkTimeout = () => {
    if (isSessionExpired()) {
      clearAuthSession();
      if (onTimeout) {
        onTimeout();
      } else {
        window.location.replace('/login?timeout=1');
      }
    }
  };

  const checkInterval = setInterval(checkTimeout, 10000);

  const handleVisibility = () => {
    if (document.visibilityState === 'visible') {
      if (isSessionExpired()) {
        clearAuthSession();
        if (onTimeout) {
          onTimeout();
        } else {
          window.location.replace('/login?timeout=1');
        }
      } else {
        handleActivity();
      }
    }
  };
  document.addEventListener('visibilitychange', handleVisibility);

  // Cross-tab synchronization: stay in sync across all tabs
  const handleStorage = (e: StorageEvent) => {
    if (e.key === 'kisan_farmer_profile' && !e.newValue) {
      // Session invalidated or logged out in another tab
      window.location.replace('/login?timeout=1');
    } else if (e.key === 'kd_last_activity' && e.newValue) {
      // Activity refreshed in another tab
      lastRecorded = parseInt(e.newValue, 10) || Date.now();
    }
  };
  window.addEventListener('storage', handleStorage);

  return () => {
    events.forEach((evt) => {
      window.removeEventListener(evt, handleActivity);
    });
    clearInterval(checkInterval);
    document.removeEventListener('visibilitychange', handleVisibility);
    window.removeEventListener('storage', handleStorage);
  };
}

export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const profile =
      window.localStorage.getItem('kisan_farmer_profile') ||
      window.sessionStorage.getItem('kisan_farmer_profile');
    if (!profile) return false;

    // Auto-logout if inactive for longer than 15 minutes
    if (isSessionExpired()) {
      clearAuthSession();
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

export function setAuthSession(tokenOrProfile: any, maybeProfile?: any): void {
  if (typeof window === 'undefined') return;
  try {
    const profile = maybeProfile || tokenOrProfile;
    saveItem('kisan_farmer_profile', profile);
    recordActivity();

    // Explicitly wipe any residual authentication tokens from client-accessible storage
    window.localStorage.removeItem('kisan_auth_token');
    window.sessionStorage.removeItem('kisan_auth_token');
  } catch {}
}

export async function clearAuthSession(): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    // 1. Invalidate server token and clear HttpOnly cookie
    try {
      await fetch('/api/logout', { method: 'POST', credentials: 'include' });
    } catch {}

    // 2. Clear active authentication session and temporary profile state
    window.localStorage.removeItem('kisan_auth_token');
    window.localStorage.removeItem('kisan_farmer_profile');
    window.localStorage.removeItem('kd_dashboard_profile');
    window.localStorage.removeItem('kd_last_activity');
    window.sessionStorage.removeItem('kd_last_activity');

    // NOTE: kd_custom_gemini_key and user-scoped kd_chat_history_* are intentionally preserved
    // so farmers do not have to re-enter their API key and their chat is remembered when they log back in.
  } catch {}
}
