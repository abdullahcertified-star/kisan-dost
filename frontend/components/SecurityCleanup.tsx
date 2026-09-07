'use client';

import { useEffect } from 'react';

/**
 * One-time automated security cleanup:
 * Permanently purges vulnerable legacy user records and plaintext credentials
 * from window.localStorage now that authentication is hosted in Neon PostgreSQL.
 */
export default function SecurityCleanup() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const vulnerableKeys = [
        'kisan_registered_farmers', // Legacy client-side user database
        'kisan_farmers_db',        // Legacy mock table
        'kisan_temp_auth',         // Temporary unhashed auth state
      ];

      let purgedCount = 0;
      vulnerableKeys.forEach((key) => {
        if (localStorage.getItem(key) !== null) {
          localStorage.removeItem(key);
          purgedCount++;
        }
      });

      if (purgedCount > 0) {
        console.log(
          `🔒 [Kisan Dost Security Audit] Successfully purged ${purgedCount} legacy local storage key(s). Authentication is now securely verified via Neon PostgreSQL & HttpOnly cookies.`
        );
      }
    } catch (err) {
      console.warn('Security cleanup skipped or storage restricted:', err);
    }
  }, []);

  return null;
}
