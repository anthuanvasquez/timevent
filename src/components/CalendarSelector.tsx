import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button"
import { CheckIcon, CalendarIcon, ChevronDownIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface CalendarSelectorProps {
  calendars: gapi.client.calendar.CalendarListEntry[];
  selectedCalendars: string[];
  onToggle: (id: string) => void;
}

export function CalendarSelector({ calendars, selectedCalendars, onToggle }: CalendarSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedCount = selectedCalendars.length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <Button 
        variant="outline" 
        className="gap-2 border-border bg-background/50"
        onClick={() => setIsOpen(!isOpen)}
      >
        <CalendarIcon className="w-4 h-4" />
        <span className="text-sm font-medium">
          {selectedCount === 0 ? 'Select Calendars' : `${selectedCount} calendar${selectedCount === 1 ? '' : 's'} selected`}
        </span>
        <ChevronDownIcon className={cn("w-4 h-4 transition-transform opacity-50", isOpen && "rotate-180")} />
      </Button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-popover border border-border rounded-xl shadow-xl z-[100] p-1 animate-in fade-in zoom-in-95 duration-100 origin-top-left">
          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
            Your Calendars
          </div>
          <div className="h-px bg-border my-1" />
          <div className="max-h-[300px] overflow-y-auto">
            {calendars.length === 0 ? (
              <div className="px-2 py-4 text-sm text-muted-foreground text-center">No calendars found</div>
            ) : (
              calendars.map((calendar) => (
                <button
                  key={calendar.id}
                  onClick={() => onToggle(calendar.id || '')}
                  className={cn(
                    "flex items-center gap-3 w-full px-2 py-1.5 rounded-md text-sm transition-colors text-left",
                    selectedCalendars.includes(calendar.id || '')
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-muted text-foreground"
                  )}
                >
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: calendar.backgroundColor || '#ccc' }}
                  />
                  <span className="truncate flex-1">{calendar.summary}</span>
                  {selectedCalendars.includes(calendar.id || '') && (
                      <CheckIcon className="w-4 h-4 ml-auto" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
