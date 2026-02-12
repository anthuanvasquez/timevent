import { useEffect, useState } from 'react';
import { CountdownTimer } from '@/components/CountdownTimer';
import { EventInfo } from '@/components/EventInfo';
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar';

function App() {
  const { nextEvent, loading, error, isSignedIn, isInitialized, signIn } = useGoogleCalendar();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 selection:bg-primary selection:text-primary-foreground">
      <div className="w-full max-w-7xl mx-auto flex flex-col items-center gap-12">
        {!isInitialized ? (
             <div className="animate-pulse text-muted-foreground text-xl">Initializing Google Services...</div>
        ) : !isSignedIn ? (
          <div className="flex flex-col items-center gap-6 animate-fade-in-up">
            <h1 className="text-4xl font-bold text-foreground tracking-tight text-center">
              Connect Your Calendar
            </h1>
            <p className="text-muted-foreground text-center max-w-md">
              Sign in with Google to see a countdown to your next event.
            </p>
            <button 
              onClick={signIn}
              className="px-8 py-3 bg-primary text-primary-foreground rounded-full text-lg font-medium hover:opacity-90 transition-opacity shadow-lg shadow-primary/25"
            >
              Sign in with Google
            </button>
          </div>
        ) : loading ? (
          <div className="animate-pulse text-muted-foreground text-xl">Loading calendar...</div>
        ) : error ? (
          <div className="text-destructive text-xl">Error: {(error as Error).message || "Unknown error"}</div>
        ) : nextEvent ? (
          <>
            <CountdownTimer targetDate={nextEvent.start?.dateTime || nextEvent.start?.date || ''} />
            <EventInfo event={nextEvent} />
          </>
        ) : (
          <div className="text-muted-foreground text-xl">No upcoming events found</div>
        )}
      </div>
      
      {/* Decorative background element */}
      <div className="fixed inset-0 -z-10 h-full w-full bg-background [background:radial-gradient(125%_125%_at_50%_10%,#000_40%,#63e_100%)] dark:[background:radial-gradient(125%_125%_at_50%_10%,#000_40%,#63e_100%)] opacity-20 pointer-events-none" />
    </div>
  );
}

export default App;
