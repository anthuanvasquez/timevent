const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'];
const SCOPES = 'https://www.googleapis.com/auth/calendar.events.readonly https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile';

export interface GoogleApiConfig {
  clientId: string;
  apiKey: string;
}

export interface UserProfile {
  email: string;
  name: string;
  picture: string;
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
      // If already initialized, resolve immediately
      if (this.gapiInited && this.gisInited) {
        this.restoreToken();
        return resolve();
      }

      let gapiLoadedFlag = !!window.gapi;
      let gisLoadedFlag = !!window.google?.accounts?.oauth2;

      const checkInit = () => {
        if (gapiLoadedFlag && gisLoadedFlag) {
            this.restoreToken();
            resolve();
        }
      };

      if (gapiLoadedFlag && gisLoadedFlag) {
          return checkInit();
      }

      const loadGapi = () => {
        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/api.js';
        script.onload = () => {
          this.gapiLoaded().then(() => {
            gapiLoadedFlag = true;
            checkInit();
          }).catch(reject);
        };
        script.onerror = reject;
        document.body.appendChild(script);
      };

      const loadGis = () => {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.onload = () => {
          this.gisLoaded().then(() => {
            gisLoadedFlag = true;
            checkInit();
          }).catch(reject);
        };
        script.onerror = reject;
        document.body.appendChild(script);
      };

      if (!gapiLoadedFlag && !document.querySelector('script[src="https://apis.google.com/js/api.js"]')) {
         loadGapi();
      } else if (!gapiLoadedFlag) {
         const checkGapi = setInterval(() => {
             if (window.gapi) {
                 clearInterval(checkGapi);
                 this.gapiLoaded().then(() => {
                     gapiLoadedFlag = true;
                     checkInit();
                 }).catch(reject);
             }
         }, 100);
      }

      if (!gisLoadedFlag && !document.querySelector('script[src="https://accounts.google.com/gsi/client"]')) {
         loadGis();
      } else if (!gisLoadedFlag) {
         const checkGis = setInterval(() => {
             if (window.google?.accounts?.oauth2) {
                 clearInterval(checkGis);
                 this.gisLoaded().then(() => {
                     gisLoadedFlag = true;
                     checkInit();
                 }).catch(reject);
             }
         }, 100);
      }
    });
  }

  private restoreToken() {
      const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (storedToken) {
          try {
              const token = JSON.parse(storedToken);
              // Check if token is expired
              if (token.expires_at && Date.now() > token.expires_at) {
                  console.log("Token expired, clearing");
                  localStorage.removeItem(TOKEN_STORAGE_KEY);
                  return;
              }
              gapi.client.setToken(token);
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
                const tokenObj = {
                    ...resp,
                    expires_at: Date.now() + (Number(resp.expires_in) * 1000)
                };
                localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokenObj));
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
          const tokenObj = {
              ...resp,
              expires_at: Date.now() + (Number(resp.expires_in) * 1000)
          };
          localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokenObj));
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

  public async getUserProfile(): Promise<UserProfile | null> {
      const token = gapi.client.getToken();
      if (!token) return null;
      try {
          const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${token.access_token}` }
          });
          if (!response.ok) throw new Error('Failed to fetch profile');
          return await response.json();
      } catch (error) {
          console.error("Error fetching profile", error);
          return null;
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