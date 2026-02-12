const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'];
const SCOPES = 'https://www.googleapis.com/auth/calendar.events.readonly https://www.googleapis.com/auth/calendar.readonly';

export interface GoogleApiConfig {
  clientId: string;
  apiKey: string;
}

export type CalendarEvent = gapi.client.calendar.Event;

const TOKEN_STORAGE_KEY = 'google_calendar_token';

export class GoogleCalendarService {
  private tokenClient: google.accounts.oauth2.TokenClient | null = null;
  private gapiInited = false;
  private gisInited = false;

  constructor(private config: GoogleApiConfig) {}

  public loadScripts(): Promise<void> {
    return new Promise((resolve, reject) => {
      const script1 = document.createElement('script');
      script1.src = 'https://apis.google.com/js/api.js';
      script1.async = true;
      script1.defer = true;
      script1.onload = () => this.gapiLoaded().then(() => checkInit());
      script1.onerror = reject;
      document.body.appendChild(script1);

      const script2 = document.createElement('script');
      script2.src = 'https://accounts.google.com/gsi/client';
      script2.async = true;
      script2.defer = true;
      script2.onload = () => this.gisLoaded().then(() => checkInit());
      script2.onerror = reject;
      document.body.appendChild(script2);

      const checkInit = () => {
        if (this.gapiInited && this.gisInited) {
            // Try to restore token
            this.restoreToken();
            resolve();
        }
      };
    });
  }

  private restoreToken() {
      const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (storedToken) {
          try {
              const token = JSON.parse(storedToken);
              gapi.client.setToken(token);
              // Basic check if token is roughly valid (Google tokens expire in 1h usually)
              // Ideally we check expiry time if we stored it, or handle 401 later.
          } catch (e) {
              console.error("Failed to restore token", e);
              localStorage.removeItem(TOKEN_STORAGE_KEY);
          }
      }
  }

  private async gapiLoaded() {
    return new Promise<void>((resolve, reject) => {
      gapi.load('client', async () => {
        try {
            await gapi.client.init({
            apiKey: this.config.apiKey,
            discoveryDocs: DISCOVERY_DOCS,
          });
          this.gapiInited = true;
          resolve();
        } catch (error) {
            reject(error);
        }
      });
    });
  }

  private async gisLoaded() {
    return new Promise<void>((resolve) => {
      this.tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: this.config.clientId,
        scope: SCOPES,
        callback: (resp: google.accounts.oauth2.TokenResponse) => {
            if (resp.error) {
                console.error("Token error:", resp);
                throw resp;
            }
            // Save token
            if (resp.access_token) {
                // We should store the whole response object usually, minus functions
                // But specifically we need access_token.
                // gapi.client.getToken() returns the object that setToken needs.
                // But here resp is the response from token client.
                // When using gapi.client, it stores it internally.
                // We can't easily get the 'internal' gapi token object during callback immediately 
                // unless we rely on gapi.client.getToken() AFTER callback.
                
                // Actually the callback response IS the token object compatible with setToken mostly.
                // Let's store it.
                localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(resp));
            }
        },
      });
      this.gisInited = true;
      resolve();
    });
  }

  public async signIn(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.tokenClient) return reject('Token client not initialized');
      
      // Override callback for this specific request to know when it completes
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this.tokenClient as any).callback = (resp: google.accounts.oauth2.TokenResponse) => {
        if (resp.error) {
          reject(resp);
        } else {
          // Manually Save token here as well to be safe
          localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(resp));
          resolve();
        }
      };
      
      // We need to request the new scopes.
      this.tokenClient.requestAccessToken({ prompt: 'consent' });
    });
  }
  
  public get isAuthenticated(): boolean {
      return gapi.client.getToken() !== null;
  }
  
  public signOut() {
      const token = gapi.client.getToken();
      if (token !== null) {
          google.accounts.oauth2.revoke(token.access_token, () => {
             gapi.client.setToken(null);
             localStorage.removeItem(TOKEN_STORAGE_KEY);
          });
      } else {
           localStorage.removeItem(TOKEN_STORAGE_KEY); // Just in case
      }
  }

  public async getCalendars(): Promise<gapi.client.calendar.CalendarListEntry[]> {
    const response = await gapi.client.calendar.calendarList.list();
    return response.result.items || [];
  }

  public async getNextEvents(calendarIds: string[] = ['primary'], maxResults: number = 10): Promise<gapi.client.calendar.Event[]> {
    const allEvents: gapi.client.calendar.Event[] = [];

    // Fetch events from all selected calendars in parallel
    await Promise.all(calendarIds.map(async (calendarId) => {
      try {
        const response = await gapi.client.calendar.events.list({
          'calendarId': calendarId,
          'timeMin': (new Date()).toISOString(),
          'showDeleted': false,
          'singleEvents': true,
          'maxResults': maxResults,
          'orderBy': 'startTime',
        });
        const events = response.result.items || [];
        // Add calendarId to each event for reference if needed
        events.forEach(event => {
            // @ts-ignore - adding a custom property
            event.calendarId = calendarId; 
        });
        allEvents.push(...events);
      } catch (error) {
        console.warn(`Failed to fetch events for calendar ${calendarId}`, error);
      }
    }));

    // Sort all events by start time
    return allEvents.sort((a, b) => {
      const startA = new Date(a.start?.dateTime || a.start?.date || 0).getTime();
      const startB = new Date(b.start?.dateTime || b.start?.date || 0).getTime();
      return startA - startB;
    }).slice(0, maxResults); // Return only the top maxResults
  }
}

export const googleService = new GoogleCalendarService({
  clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
  apiKey: import.meta.env.VITE_GOOGLE_API_KEY || '',
});
