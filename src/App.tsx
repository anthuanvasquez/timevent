import { useEffect, useState } from 'react';
import { CountdownTimer } from '@/components/CountdownTimer';
import { EventInfo } from '@/components/EventInfo';
import { CalendarSelector } from '@/components/CalendarSelector';
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar';
import { Skeleton } from '@/components/ui/skeleton';

function App() {
  const { nextEvent, loading, error, isSignedIn, isInitialized, signIn, signOut, calendars, selectedCalendars, toggleCalendar, userProfile } = useGoogleCalendar();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#4158D0] bg-[linear-gradient(43deg,#4158D0_0%,#C850C0_46%,#FFCC70_100%)] text-white overflow-x-hidden selection:bg-white/30">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 p-6 flex items-center justify-between z-50">
            <div className="flex items-center gap-6">
                <h1 className="text-2xl font-bold tracking-tight">TimeVent</h1>
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
                         <span className="hidden md:inline text-sm font-medium opacity-80">
                             {userProfile?.email || userProfile?.name || 'Cargando perfil...'} 
                         </span>
                         {userProfile?.picture && (
                             <img 
                                src={userProfile.picture} 
                                alt="Profile" 
                                className="w-8 h-8 rounded-full border border-white/20"
                             />
                         )}
                         <button 
                            onClick={signOut}
                            className="bg-white/20 hover:bg-white/30 backdrop-blur-md px-4 py-2 rounded-full text-sm font-medium transition-all border border-white/10"
                        >
                            Sign Out
                         </button>
                    </>
                ) : (
                    <button 
                        onClick={signIn}
                        className="bg-white text-purple-600 px-6 py-2 rounded-full font-bold hover:bg-gray-100 transition-colors shadow-lg"
                    >
                        Sign In
                    </button>
                )}
            </div>
        </header>

      <main className="min-h-screen flex flex-col items-center justify-center p-4 pt-24 relative">
        {!isInitialized ? (
             <div className="animate-pulse text-2xl font-light">Initializing...</div>
        ) : !isSignedIn ? (
          <div className="flex flex-col items-center gap-8 text-center max-w-2xl animate-fade-in-up">
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-4">
                Time is <br/> Everything.
            </h1>
            <p className="text-xl md:text-2xl text-white/80 font-light leading-relaxed">
              Connect your Google Calendar to stay punctual and never miss a beat.
            </p>
            <button 
              onClick={signIn}
              className="mt-8 px-10 py-4 bg-white text-purple-600 rounded-full text-xl font-bold hover:scale-105 transition-transform shadow-2xl"
            >
              Get Started with Google
            </button>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center gap-8 w-full max-w-5xl animate-pulse">
             <div className="flex gap-4 items-end justify-center w-full">
                <Skeleton className="h-32 w-32 rounded-lg" />
                <Skeleton className="h-32 w-32 rounded-lg" />
                <Skeleton className="h-32 w-32 rounded-lg" />
                <Skeleton className="h-32 w-32 rounded-lg" />
             </div>
             <Skeleton className="h-64 w-full max-w-2xl rounded-3xl" />
          </div>
        ) : error ? (
          <div className="bg-red-500/80 backdrop-blur-xl p-6 rounded-2xl text-white max-w-md text-center">
              <p className="font-bold text-lg mb-2">Something went wrong</p>
              <p className="opacity-90">{(error as Error).message || "Unknown error"}</p>
              <button onClick={() => window.location.reload()} className="mt-4 underline">Retry</button>
          </div>
        ) : nextEvent ? (
          <div className="flex flex-col items-center w-full max-w-5xl">
            <CountdownTimer targetDate={nextEvent.start?.dateTime || nextEvent.start?.date || ''} />
            <EventInfo event={nextEvent} calendars={calendars} />
            
            <div className="mt-8 text-white/40 text-sm font-medium animate-pulse">
                {/* Placeholder for future feature */}
                Waiting for more events...
            </div>
          </div>
        ) : (
          <div className="text-center flex flex-col items-center gap-4 animate-fade-in-up">
             <div className="text-8xl mb-4">🎉</div>
             <h2 className="text-4xl font-bold">You're all caught up!</h2>
             <p className="text-xl text-white/60">No upcoming events found in selected calendars.</p>
          </div>
        )}
      </main>
      
      {/* Decorative background element override if needed, but the css gradient covers it */}
    </div>
  );
}

export default App;
