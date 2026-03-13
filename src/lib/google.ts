export interface UserProfile {
  email: string;
  name: string;
  picture: string;
}

export type CalendarEvent = any; // Simplify for now or use proper types

export class GoogleCalendarService {
  private baseUrl = "https://www.googleapis.com/calendar/v3";

  constructor(private accessToken?: string) {}

  private async fetch(endpoint: string, options: RequestInit = {}) {
    if (!this.accessToken) throw new Error("No access token provided");

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || "Failed to fetch from Google API");
    }

    return response.json();
  }

  public async getCalendars(): Promise<any[]> {
    const data = await this.fetch("/users/me/calendarList");
    return data.items || [];
  }

  public async getNextEvents(calendarIds: string[] = ['primary'], maxResults: number = 10): Promise<any[]> {
    const allEvents: any[] = [];

    await Promise.all(
      calendarIds.map(async (calendarId) => {
        try {
          const timeMin = new Date().toISOString();
          const data = await this.fetch(
            `/calendars/${encodeURIComponent(calendarId)}/events?timeMin=${timeMin}&showDeleted=false&singleEvents=true&maxResults=${maxResults}&orderBy=startTime`
          );
          const events = data.items || [];
          events.forEach((event: any) => {
            event.calendarId = calendarId;
          });
          allEvents.push(...events);
        } catch (error) {
          console.warn(`Failed to fetch events for calendar ${calendarId}`, error);
        }
      })
    );

    return allEvents
      .sort((a, b) => {
        const startA = new Date(a.start?.dateTime || a.start?.date || 0).getTime();
        const startB = new Date(b.start?.dateTime || b.start?.date || 0).getTime();
        return startA - startB;
      })
      .slice(0, maxResults);
  }
}

export const getGoogleService = (accessToken?: string) => new GoogleCalendarService(accessToken);
