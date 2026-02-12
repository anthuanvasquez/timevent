# Timevent - Google Calendar Countdown

A modern, aesthetic web application built with React, Vite, TypeScript, and Tailwind CSS that displays a countdown timer to your next upcoming Google Calendar event.

## Features

- **Real-Time Countdown**: Displays days, hours, minutes, and seconds to your next meeting.
- **Event Details**: Shows the summary and time of the upcoming event.
- **Google Integration**: seamless sign-in with your Google account.
- **Responsive Design**: Beautifully crafted UI that works on all devices.
- **Dark Mode Support**: Automatically adapts to system preferences (configurable).

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or pnpm

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/yourusername/timevent.git
    cd timevent
    ```

2.  Install dependencies:
    ```bash
    npm install
    # or
    pnpm install
    ```

3.  **Configure Environment Variables** (See section below).

4.  Start the development server:
    ```bash
    npm run dev
    ```

## Google Calendar API Configuration

To make this app work with your real calendar, you need to obtain credentials from the Google Cloud Console.

### Step 1: Create a Google Cloud Project
1.  Go to the [Google Cloud Console](https://console.cloud.google.com/).
2.  Click the project dropdown at the top and select **"New Project"**.
3.  Name your project (e.g., "Timevent Countdown") and click **Create**.

### Step 2: Enable the Calendar API
1.  In your new project, go to **"APIs & Services" > "Library"**.
2.  Search for **"Google Calendar API"**.
3.  Click on it and select **Enable**.

### Step 3: Configure Consent Screen
1.  Go to **"APIs & Services" > "OAuth consent screen"**.
2.  Select **External** (unless you have a Google Workspace organization, then Internal is fine) and click **Create**.
3.  Fill in the required fields:
    - **App name**: Timevent
    - **User support email**: Your email
    - **Developer contact information**: Your email
4.  Click **Save and Continue**.
5.  **Scopes**: Click **Add or Remove Scopes**.
    - Search for `calendar.events.readonly`.
    - Select existing `.../auth/calendar.events.readonly` scope.
    - Click **Update** and then **Save and Continue**.
6.  **Test Users** (Important for "External" apps):
    - Click **Add Users**.
    - Add your own Google email address (and any others you want to test with).
    - *Note: Without this, you will get a 403 error during sign-in.*

### Step 4: Create Credentials
1.  Go to **"APIs & Services" > "Credentials"**.
2.  Click **Create Credentials** and select **OAuth client ID**.
3.  **Application type**: Web application.
4.  **Name**: Timevent Web Client.
5.  **Authorized JavaScript origins**:
    - Add `http://localhost:5173` (or your production URL).
6.  **Authorized redirect URIs**:
    - Add `http://localhost:5173` (and `http://localhost:5173/` just to be safe).
7.  Click **Create**.
8.  Copy the **Client ID** (e.g., `123456...apps.googleusercontent.com`).

9.  (Optional but recommended for some flows) Create an **API Key**:
    - Click **Create Credentials** > **API Key**.
    - (Optional) Restrict the key to "Google Calendar API" and "HTTP referrers" (localhost:5173) for security.
    - Copy the **API Key**.

### Step 5: Set up .env file
1.  Copy the example environment file:
    ```bash
    cp .env.example .env
    ```
2.  Open `.env` and paste your credentials:
    ```env
    VITE_GOOGLE_CLIENT_ID=your_pasted_client_id
    VITE_GOOGLE_API_KEY=your_pasted_api_key
    ```
    *(Note: If you didn't create an API Key, you can often leave it blank if using OAuth token primarily, but the current implementation expects it for initialization).*

## Technologies Used

- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Shadcn/UI](https://ui.shadcn.com/)
- [Google Identity Services](https://developers.google.com/identity/gsi/web)
