import { useState, useEffect, useCallback } from 'react';
import { googleService, CalendarEvent, UserProfile } from '@/lib/google';

export type { CalendarEvent };

export function useGoogleCalendar() {
  const [nextEvent, setNextEvent] = useState<gapi.client.calendar.Event | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [isSignedIn, setIsSignedIn] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  const [calendars, setCalendars] = useState<gapi.client.calendar.CalendarListEntry[]>([]);
  const [selectedCalendars, setSelectedCalendars] = useState<string[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Initialize GAPI/GIS once
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        await googleService.loadScripts();
        if (mounted) {
          setIsInitialized(true);
          // Check if we already have a session
          setIsSignedIn(googleService.isAuthenticated);
          
          if (googleService.isAuthenticated) {
              const profile = await googleService.getUserProfile();
              setUserProfile(profile);
              await fetchCalendars(profile?.email);
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

  // Save selected calendars when they change
  useEffect(() => {
    if (userProfile?.email && selectedCalendars.length > 0) {
        localStorage.setItem(`timevent_cals_${userProfile.email}`, JSON.stringify(selectedCalendars));
    }
  }, [selectedCalendars, userProfile]);

  const fetchCalendars = async (email?: string) => {
      try {
          const calendarList = await googleService.getCalendars();
          setCalendars(calendarList);
          
          let savedSelections: string[] | null = null;
          if (email) {
             const stored = localStorage.getItem(`timevent_cals_${email}`);
             if (stored) savedSelections = JSON.parse(stored);
          }

          // Default to selecting the primary calendar if no selection exists
          if (savedSelections && savedSelections.length > 0) {
             setSelectedCalendars(savedSelections);
          } else if (selectedCalendars.length === 0) {
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
      const profile = await googleService.getUserProfile();
      setUserProfile(profile);
      await fetchCalendars(profile?.email);
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
    setUserProfile(null);
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
      toggleCalendar,
      userProfile
  };
}
