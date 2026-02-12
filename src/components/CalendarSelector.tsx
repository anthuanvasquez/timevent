import React, { useState } from 'react';

interface CalendarSelectorProps {
  calendars: gapi.client.calendar.CalendarListEntry[];
  selectedCalendars: string[];
  onToggle: (id: string) => void;
}

export function CalendarSelector({ calendars, selectedCalendars, onToggle }: CalendarSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedCount = selectedCalendars.length;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white hover:bg-white/20 transition-all"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
        <span className="text-sm font-medium">
          {selectedCount === 0 ? 'Select Calendars' : `${selectedCount} calendar${selectedCount === 1 ? '' : 's'} selected`}
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-xl p-2 shadow-xl z-50 flex flex-col gap-1 max-h-[300px] overflow-y-auto">
          {calendars.map((calendar) => (
            <button
              key={calendar.id}
              onClick={() => onToggle(calendar.id || '')}
              className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm transition-colors ${
                selectedCalendars.includes(calendar.id || '')
                  ? 'bg-white/20 text-white'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <div
                className="w-3 h-3 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]"
                style={{ backgroundColor: calendar.backgroundColor || '#ccc' }}
              />
              <span className="truncate flex-1 text-left">{calendar.summary}</span>
              {selectedCalendars.includes(calendar.id || '') && (
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              )}
            </button>
          ))}
          {calendars.length === 0 && (
            <div className="px-3 py-2 text-sm text-gray-500 text-center">No calendars found</div>
          )}
        </div>
      )}
    </div>
  );
}
