'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession, signIn, signOut } from 'next-auth/react';
import { getGoogleService, UserProfile, CalendarEvent } from '@/lib/google';

export type { CalendarEvent };

export function useGoogleCalendar() {
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();
  
  const isSignedIn = status === 'authenticated';
  const isSigningIn = status === 'loading';
  const isInitialized = status !== 'loading'; // In Next.js, we consider it initialized when session status is determined
  
  const userProfile = useMemo((): UserProfile | null => {
    if (!session?.user) return null;
    return {
      email: session.user.email || '',
      name: session.user.name || '',
      picture: session.user.image || '',
    };
  }, [session]);

  const accessToken = (session as any)?.accessToken;
  const googleService = useMemo(() => getGoogleService(accessToken), [accessToken]);

  // Local state for calendar selection
  const [selectedCalendars, setSelectedCalendars] = useState<string[]>([]);

  // Load saved preferences
  useEffect(() => {
    if (userProfile?.email) {
      const stored = localStorage.getItem(`nextcal_cals_${userProfile.email}`);
      if (stored) {
        setSelectedCalendars(JSON.parse(stored));
      }
    }
  }, [userProfile?.email]);

  // Persist preferences
  useEffect(() => {
    if (userProfile?.email && selectedCalendars.length > 0) {
      localStorage.setItem(`nextcal_cals_${userProfile.email}`, JSON.stringify(selectedCalendars));
    }
  }, [selectedCalendars, userProfile?.email]);

  // Query for Calendars
  const { data: calendars = [] } = useQuery({
    queryKey: ['calendars', userProfile?.email],
    queryFn: () => googleService.getCalendars(),
    enabled: isSignedIn && !!accessToken,
  });

  // Default selection
  useEffect(() => {
    if (calendars.length > 0 && selectedCalendars.length === 0) {
      const primary = calendars.find((c: any) => c.primary);
      if (primary?.id) setSelectedCalendars([primary.id]);
    }
  }, [calendars, selectedCalendars.length]);

  // Query for Next Event
  const { 
    data: nextEvent = null, 
    isLoading: loading, 
    error,
    isFetched: hasInitialFetched
  } = useQuery({
    queryKey: ['nextEvent', selectedCalendars, accessToken],
    queryFn: async () => {
      const events = await googleService.getNextEvents(selectedCalendars, 1);
      return events.length > 0 ? events[0] : null;
    },
    enabled: isSignedIn && !!accessToken && selectedCalendars.length > 0,
    refetchInterval: 1000 * 60,
  });

  const toggleCalendar = useCallback((calendarId: string) => {
    setSelectedCalendars(prev => {
      if (prev.includes(calendarId)) {
        return prev.filter(id => id !== calendarId);
      } else {
        return [...prev, calendarId];
      }
    });
  }, []);

  const handleSignIn = () => signIn('google');
  const handleSignOut = () => {
    queryClient.clear();
    signOut();
  };

  return { 
    nextEvent, 
    loading, 
    error, 
    isSignedIn, 
    isSigningIn,
    isInitialized, 
    hasInitialFetched,
    signIn: handleSignIn, 
    signOut: handleSignOut,
    refresh: () => queryClient.invalidateQueries({ queryKey: ['nextEvent'] }),
    calendars,
    selectedCalendars,
    toggleCalendar,
    userProfile
  };
}
