const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'];
const SCOPES = 'https://www.googleapis.com/auth/calendar.events.readonly';

export interface GoogleApiConfig {
  clientId: string;
  apiKey: string;
}

export type CalendarEvent = gapi.client.calendar.Event;

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
        if (this.gapiInited && this.gisInited) resolve();
      };
    });
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
          resolve();
        }
      };
      
      this.tokenClient.requestAccessToken({ prompt: 'consent' });
    });
  }
  
  public get isAuthenticated(): boolean {
      return gapi.client.getToken() !== null;
  }

  public async getNextEvents(maxResults: number = 10): Promise<gapi.client.calendar.Event[]> {
    const response = await gapi.client.calendar.events.list({
      'calendarId': 'primary',
      'timeMin': (new Date()).toISOString(),
      'showDeleted': false,
      'singleEvents': true,
      'maxResults': maxResults,
      'orderBy': 'startTime',
    });
    return response.result.items || [];
  }
}

export const googleService = new GoogleCalendarService({
  clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
  apiKey: import.meta.env.VITE_GOOGLE_API_KEY || '',
});
