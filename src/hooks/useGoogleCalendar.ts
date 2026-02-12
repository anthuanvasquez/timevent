import { useState, useEffect, useCallback } from 'react';
import { googleService, CalendarEvent } from '@/lib/google';

export type { CalendarEvent };

export function useGoogleCalendar() {
  const [nextEvent, setNextEvent] = useState<gapi.client.calendar.Event | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [isSignedIn, setIsSignedIn] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // Initialize GAPI/GIS once
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        await googleService.loadScripts();
        if (mounted) {
          setIsInitialized(true);
          // Check if we already have a session (this is basic, might need more robust check)
          // But actually gapi.auth2 is deprecated, so we rely on explicit sign in usually
          // or existing token. googleService.isAuthenticated checks gapi.client.getToken()
          setIsSignedIn(googleService.isAuthenticated);
          
          if (googleService.isAuthenticated) {
              fetchEvents();
          } else {
              setLoading(false); // Done loading scripts, waiting for sign in
          }
        }
      } catch (err) {
        if (mounted) {
          setError(err as Error);
          setLoading(false);
        }
      }
    };

    init();

    return () => { mounted = false; };
  }, []);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const events = await googleService.getNextEvents(1);
      if (events.length > 0) {
        setNextEvent(events[0]);
      } else {
        setNextEvent(null);
      }
    } catch (err) {
      console.error("Failed to fetch events", err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  const signIn = async () => {
    try {
      await googleService.signIn();
      setIsSignedIn(true);
      fetchEvents();
    } catch (err) {
      console.error("Sign in failed", err);
      setError(err as Error);
    }
  };

  return { nextEvent, loading, error, isSignedIn, isInitialized, signIn, refresh: fetchEvents };
}
