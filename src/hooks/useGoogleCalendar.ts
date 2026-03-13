import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { googleService, CalendarEvent, UserProfile } from '@/lib/google';

export type { CalendarEvent };

export function useGoogleCalendar() {
  const queryClient = useQueryClient();
  const [isSignedIn, setIsSignedIn] = useState<boolean>(() => {
    return localStorage.getItem('google_calendar_token') !== null;
  });
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  
  // Local state for user preferences
  const [selectedCalendars, setSelectedCalendars] = useState<string[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // 1. Initialization Effect
  useEffect(() => {
    let mounted = true;
    const init = async () => {
      try {
        await googleService.loadScripts();
        if (mounted) {
          setIsInitialized(true);
          const authenticated = googleService.isAuthenticated;
          setIsSignedIn(authenticated);
          
          if (authenticated) {
              const profile = await googleService.getUserProfile();
              setUserProfile(profile);
              
              // Load saved calendar preferences for this user
              if (profile?.email) {
                  const stored = localStorage.getItem(`nextcal_cals_${profile.email}`);
                  if (stored) {
                      setSelectedCalendars(JSON.parse(stored));
                  }
              }
          }
        }
      } catch (err) {
        if (mounted) {
          setIsInitialized(true);
        }
      }
    };

    init();
    const timer = setTimeout(() => { if (mounted) setIsInitialized(true); }, 5000);
    return () => { mounted = false; clearTimeout(timer); };
  }, []);

  // 2. Query for Calendars
  const { data: calendars = [] } = useQuery({
    queryKey: ['calendars', userProfile?.email],
    queryFn: () => googleService.getCalendars(),
    enabled: isSignedIn && isInitialized,
  });

  // Set default selection if none exists
  useEffect(() => {
      if (calendars.length > 0 && selectedCalendars.length === 0) {
          const primary = calendars.find(c => c.primary);
          if (primary?.id) setSelectedCalendars([primary.id]);
      }
  }, [calendars, selectedCalendars.length]);

  // 3. Query for Next Event
  const { 
      data: nextEvent = null, 
      isLoading: loading, 
      error,
      isFetched: hasInitialFetched
  } = useQuery({
    queryKey: ['nextEvent', selectedCalendars],
    queryFn: async () => {
        const events = await googleService.getNextEvents(selectedCalendars, 1);
        return events.length > 0 ? events[0] : null;
    },
    enabled: isSignedIn && isInitialized && selectedCalendars.length > 0,
    refetchInterval: 1000 * 60, // Refresh every minute
  });

  // Persist preferences
  useEffect(() => {
    if (userProfile?.email && selectedCalendars.length > 0) {
        localStorage.setItem(`nextcal_cals_${userProfile.email}`, JSON.stringify(selectedCalendars));
    }
  }, [selectedCalendars, userProfile]);

  // 4. Actions
  const signIn = useCallback(async () => {
    try {
      setIsSigningIn(true);
      await googleService.signIn();
      setIsSignedIn(true);
      const profile = await googleService.getUserProfile();
      setUserProfile(profile);
      if (profile?.email) {
          const stored = localStorage.getItem(`nextcal_cals_${profile.email}`);
          if (stored) setSelectedCalendars(JSON.parse(stored));
      }
      queryClient.invalidateQueries({ queryKey: ['calendars'] });
      queryClient.invalidateQueries({ queryKey: ['nextEvent'] });
    } catch (err) {
      console.error("Sign in failed", err);
    } finally {
      setIsSigningIn(false);
    }
  }, [queryClient]);

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
    setSelectedCalendars([]);
    queryClient.clear();
  }, [queryClient]);

  return { 
      nextEvent, 
      loading, 
      error, 
      isSignedIn, 
      isSigningIn,
      isInitialized, 
      hasInitialFetched,
      signIn, 
      signOut,
      refresh: () => queryClient.invalidateQueries({ queryKey: ['nextEvent'] }),
      calendars,
      selectedCalendars,
      toggleCalendar,
      userProfile
  };
}
