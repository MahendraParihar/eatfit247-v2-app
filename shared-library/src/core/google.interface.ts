export interface IGoogleCalendarStatus {
  connected: boolean;
  email?: string;
  connectedAt?: Date;
}

export interface IGoogleCalendarEvent {
  id: string;
  iCalUID: string;
  location: string;
  status: string;
  htmlLink: string;
  hangoutLink: string;
  start: {
    date?: string | null;
    dateTime?: string | null;
    timeZone?: string | null;
  };
  originalStartTime: {
    date?: string | null;
    dateTime?: string | null;
    timeZone?: string | null;
  };
  end: {
    date?: string | null;
    dateTime?: string | null;
    timeZone?: string | null;
  };
}