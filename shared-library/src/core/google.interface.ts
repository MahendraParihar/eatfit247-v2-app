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

export interface IGoogleReview {
  reviewId: string;
  reviewer: {
    displayName: string;
    profilePhotoUrl?: string;
  };
  starRating: 'ONE' | 'TWO' | 'THREE' | 'FOUR' | 'FIVE';
  comment?: string;
  createTime: string;
  updateTime: string;
  reviewReply?: {
    comment: string;
    updateTime: string;
  };
}

export interface IGoogleReviewsResponse {
  reviews: Array<IGoogleReview>;
  averageRating?: number;
  totalReviewCount?: number;
}