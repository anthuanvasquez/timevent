import { useState, useEffect, useCallback } from 'react';
import { googleService, CalendarEvent } from '@/lib/google';

export type { CalendarEvent };

export function useGoogleCalendar() {
  const [nextEvent, setNextEvent] = useState<gapi.client.calendar.Event | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [isSignedIn, setIsSignedIn] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  const [calendars, setCalendars] = useState<gapi.client.calendar.CalendarListEntry[]>([]);
  const [selectedCalendars, setSelectedCalendars] = useState<string[]>([]);

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
              await fetchCalendars();
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

  const fetchCalendars = async () => {
      try {
          const calendarList = await googleService.getCalendars();
          setCalendars(calendarList);
          // Default to selecting the primary calendar if no selection exists
          if (selectedCalendars.length === 0) {
             const primary = calendarList.find(c => c.primary);
             if (primary?.id) setSelectedCalendars([primary.id]);
          }
      } catch (err) {
          console.error("Failed to fetch calendars", err);
      }
  };

  const fetchEvents = useCallback(async () => {
    if (!googleService.isAuthenticated) return;
    try {
      setLoading(true);
      // specific logic: if no calendars selected (and we have loaded calendars), maybe select primary?
      // but fetchCalendars handles init. 
      // If selectedCalendars is empty but we are signed in, it might mean user deselected all.
      // So we pass selectedCalendars.
      
      // We need to pass the *current* selectedCalendars. 
      // Since this is inside useCallback, we should add selectedCalendars to dependency or pass it as arg.
      // Better to make fetchEvents invoke with current state, but state usage in useCallback is tricky.
      // We'll trust the state is up to date when called from effects, 
      // but for manual refresh using the hook return, we need to be careful.
      // Actually, let's just use the state directly.
      
      const events = await googleService.getNextEvents(selectedCalendars, 1);
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
  }, [selectedCalendars]);

  // Re-fetch events when selected calendars change
  useEffect(() => {
      if (isSignedIn && isInitialized) {
          fetchEvents();
      }
  }, [selectedCalendars, isSignedIn, isInitialized, fetchEvents]);

  const signIn = useCallback(async () => {
    try {
      await googleService.signIn();
      setIsSignedIn(true);
      await fetchCalendars();
    } catch (err) {
      console.error("Sign in failed", err);
      setError(err as Error);
    }
  }, []);

  const toggleCalendar = useCallback((calendarId: string) => {
      setSelectedCalendars(prev => {
          if (prev.includes(calendarId)) {
              return prev.filter(id => id !== calendarId);
          } else {
              return [...prev, calendarId];
          }
      });
  }, []);

  const signOut = useCallback(() => {
    googleService.signOut();
    setIsSignedIn(false);
    setNextEvent(null);
    setCalendars([]);
    setSelectedCalendars([]);
  }, []);

  return { 
      nextEvent, 
      loading, 
      error, 
      isSignedIn, 
      isInitialized, 
      signIn, 
      signOut,
      refresh: fetchEvents,
      calendars,
      selectedCalendars,
      toggleCalendar
  };
}
