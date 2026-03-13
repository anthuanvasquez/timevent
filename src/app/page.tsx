'use client';

import { useEffect, useState } from 'react';
import { CountdownTimer } from '@/components/CountdownTimer';
import { EventInfo } from '@/components/EventInfo';
import { CalendarSelector } from '@/components/CalendarSelector';
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function Home() {
  const { 
    nextEvent, 
    loading, 
    error, 
    isSignedIn, 
    isSigningIn, 
    isInitialized, 
    hasInitialFetched, 
    signIn, 
    signOut, 
    calendars, 
    selectedCalendars, 
    toggleCalendar, 
    userProfile 
  } = useGoogleCalendar();
  
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-primary/30 font-sans">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 p-6 flex items-center justify-between z-50 bg-background/80 backdrop-blur-md border-b border-border">
            <div className="flex items-center gap-6">
                <h1 className="text-2xl font-bold tracking-tight">NextCal</h1>
                {isSignedIn && (
                    <CalendarSelector 
                        calendars={calendars} 
                        selectedCalendars={selectedCalendars} 
                        onToggle={toggleCalendar} 
                    />
                )}
            </div>

            <div className="flex items-center gap-4">
                {isSignedIn ? (
                    <>
                         <span className="hidden md:inline text-sm font-medium text-muted-foreground">
                             {userProfile?.email || userProfile?.name || 'Cargando perfil...'} 
                         </span>
                         {userProfile?.picture && (
                             <Avatar className="w-8 h-8 border border-border">
                               <AvatarImage src={userProfile.picture} alt={userProfile.name || 'User'} />
                               <AvatarFallback>{userProfile.email?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                             </Avatar>
                         )}
                         <Button variant="outline" size="sm" onClick={signOut}>
                            Sign Out
                         </Button>
                    </>
                ) : (
                    <Button onClick={signIn} disabled={isSigningIn}>
                        {isSigningIn ? 'Connecting...' : 'Sign In with Google'}
                    </Button>
                )}
            </div>
        </header>

      <main className="min-h-screen flex flex-col items-center justify-center p-4 pt-24 relative">
        {!isSignedIn ? (
          <div className="flex flex-col items-center gap-8 text-center max-w-2xl animate-fade-in-up">
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-4 text-foreground">
                Time is <br/> Everything.
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground font-light leading-relaxed">
              Connect your Google Calendar to stay punctual and never miss a beat.
            </p>
            <Button size="lg" className="mt-8 text-lg px-8 h-14 rounded-full" onClick={signIn} disabled={isSigningIn}>
              {isSigningIn ? 'Connecting to Google...' : 'Get Started with Google'}
            </Button>
          </div>
        ) : !hasInitialFetched || loading ? (
          <div className="flex flex-col items-center gap-8 w-full max-w-5xl animate-pulse">
             <div className="flex gap-4 items-end justify-center w-full">
                <Skeleton className="h-32 w-32 rounded-lg bg-muted" />
                <Skeleton className="h-32 w-32 rounded-lg bg-muted" />
                <Skeleton className="h-32 w-32 rounded-lg bg-muted" />
                <Skeleton className="h-32 w-32 rounded-lg bg-muted" />
             </div>
             <Skeleton className="h-64 w-full max-w-2xl rounded-3xl bg-muted" />
          </div>
        ) : error ? (
          <div className="bg-destructive/10 border border-destructive/20 backdrop-blur-xl p-6 rounded-2xl text-destructive-foreground max-w-md text-center">
              <p className="font-bold text-lg mb-2 text-destructive">Something went wrong</p>
              <p className="opacity-90 text-destructive">{(error as Error).message || "Unknown error"}</p>
              <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>Retry</Button>
          </div>
        ) : nextEvent ? (
          <div className="flex flex-col items-center w-full max-w-5xl">
            <CountdownTimer targetDate={nextEvent.start?.dateTime || nextEvent.start?.date || ''} />
            <EventInfo event={nextEvent} calendars={calendars} />
            
            <div className="mt-8 text-muted-foreground text-sm font-medium animate-pulse">
                Waiting for more events...
            </div>
          </div>
        ) : (
          <div className="text-center flex flex-col items-center gap-4 animate-fade-in-up">
             <div className="text-8xl mb-4">🎉</div>
             <h2 className="text-4xl font-bold text-foreground">You're all caught up!</h2>
             <p className="text-xl text-muted-foreground">No upcoming events found in selected calendars.</p>
          </div>
        )}
      </main>
    </div>
  );
}
