'use client';

import { CalendarEvent } from '@/hooks/useGoogleCalendar';
import { useMemo } from 'react';

interface EventInfoProps {
  event: CalendarEvent;
  calendars: gapi.client.calendar.CalendarListEntry[];
}

export function EventInfo({ event, calendars }: EventInfoProps) {
  if (!event) return null;

  const startDate = new Date(event.start?.dateTime || event.start?.date || '');
  const endDate = new Date(event.end?.dateTime || event.end?.date || '');
  
  // Custom format: "Tomorrow at 12:10 AM - 01:10 AM"
  // This is a simplified formatter, a real app might use date-fns or similar
  const dateString = useMemo(() => {
      const now = new Date();
      const isToday = startDate.toDateString() === now.toDateString();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const isTomorrow = startDate.toDateString() === tomorrow.toDateString();
      
      let dayPart = startDate.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
      if (isToday) dayPart = 'Today';
      if (isTomorrow) dayPart = 'Tomorrow';

      const timeOptions: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit' };
      const startPart = startDate.toLocaleTimeString(undefined, timeOptions);
      const endPart = endDate.toLocaleTimeString(undefined, timeOptions);

      return `${dayPart} at ${startPart} - ${endPart}`;
  }, [startDate, endDate]);

  // @ts-ignore - we added this property in google.ts
  const calendarId = event.calendarId;
  const calendarName = calendars.find(c => c.id === calendarId)?.summary || 'Calendar';
  const calendarColor = calendars.find(c => c.id === calendarId)?.backgroundColor || '#ccc';

  return (
    <div className="w-full max-w-2xl bg-card border border-border rounded-3xl p-8 shadow-sm text-card-foreground text-left animate-fade-in-up mt-12">
      <h2 className="text-3xl font-bold mb-6">
        {event.summary || '(No Title)'}
      </h2>

      <div className="flex flex-col gap-4 text-muted-foreground">
          {/* Time */}
          <div className="flex items-center gap-3">
              <div className="bg-muted text-foreground p-2 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              </div>
              <span className="text-lg font-medium">{dateString}</span>
          </div>

          {/* Calendar Name */}
          <div className="flex items-center gap-3">
               <div className="bg-muted text-foreground p-2 rounded-lg">
                 <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
               </div>
               <div className="flex items-center gap-2">
                   <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: calendarColor }} />
                   <span className="text-lg font-medium">{calendarName}</span>
               </div>
          </div>

          {/* Location */}
          {event.location && (
            <div className="flex items-center gap-3">
                <div className="bg-muted text-foreground p-2 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                </div>
                <span className="text-lg font-medium text-muted-foreground">{event.location}</span>
            </div>
          )}
      </div>

      <div className="my-6 border-t border-border w-full" />

      {/* Description */}
      {event.description && (
          <div className="mb-6">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Description</h3>
              <div 
                  className="text-card-foreground leading-relaxed text-sm prose dark:prose-invert max-w-none" 
                  dangerouslySetInnerHTML={{ __html: event.description }} 
              />
          </div>
      )}

      {/* Attendees */}
      {event.attendees && event.attendees.length > 0 && (
          <div>
               <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Attendees ({event.attendees.length})</h3>
               <div className="flex flex-wrap gap-4">
                   {event.attendees.map((attendee: any) => (
                       <div key={attendee.email} className="flex items-center gap-2 text-sm text-card-foreground bg-muted/50 px-3 py-1.5 rounded-full border border-border">
                            <div className={`w-2 h-2 rounded-full ${attendee.responseStatus === 'accepted' ? 'bg-green-500' : attendee.responseStatus === 'declined' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                            <span>{attendee.displayName || attendee.email}</span>
                            {attendee.organizer && <span className="text-muted-foreground italic ml-1">(organizer)</span>}
                       </div>
                   ))}
               </div>
          </div>
      )}
      
    </div>
  );
}
