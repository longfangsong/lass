/**
 * usePrivacyConsent Hook
 * 
 * Hook to check if user has consented to privacy policy.
 * Consent is stored in localStorage (client-side only).
 */

import { useState, useEffect } from 'react';

const CONSENT_KEY = 'lass_privacy_consent';

export function usePrivacyConsent() {
  const [hasConsented, setHasConsented] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(CONSENT_KEY);
    setHasConsented(!!consent);
    setIsLoaded(true);
  }, []);

  const giveConsent = () => {
    localStorage.setItem(CONSENT_KEY, new Date().toISOString());
    setHasConsented(true);
  };

  return { hasConsented, isLoaded, giveConsent };
}
