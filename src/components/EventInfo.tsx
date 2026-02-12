import { CalendarEvent } from '@/hooks/useGoogleCalendar';

interface EventInfoProps {
  event: CalendarEvent;
}

export function EventInfo({ event }: EventInfoProps) {
  if (!event) return null;

  return (
    <div className="mt-8 text-center animate-fade-in-up">
      <h2 className="text-2xl md:text-3xl font-light text-muted-foreground tracking-wide">
        UPCOMING EVENT
      </h2>
      <h1 className="text-4xl md:text-6xl font-bold text-foreground mt-4 tracking-tight">
        {event.summary}
      </h1>
      <p className="text-lg md:text-xl text-muted-foreground mt-2">
        {new Date(event.start.dateTime || event.start.date || '').toLocaleString(undefined, {
          weekday: 'long',
          hour: 'numeric',
          minute: 'numeric',
        })}
      </p>
    </div>
  );
}
