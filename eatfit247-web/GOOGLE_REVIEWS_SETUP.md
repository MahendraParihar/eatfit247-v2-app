# Google Reviews Integration Setup

This guide explains how to set up Google Reviews integration for the Contact Us page testimonials section.

## Overview

The Contact Us page can dynamically pull Google reviews from your Google Business Profile to display as testimonials. The implementation includes:

- **GoogleReviewsService**: Service to fetch reviews from Google Places API
- **Fallback mechanism**: Uses hardcoded testimonials if API fails
- **Loading states**: Shows spinner while fetching reviews
- **Error handling**: Gracefully handles API errors

## Setup Instructions

### Option 1: Direct API Integration (Development/Testing)

1. **Get Google Places API Key**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable "Places API"
   - Create credentials (API Key)
   - Restrict API key to "Places API" for security

2. **Get Your Place ID**:
   - Go to [Google Place ID Finder](https://developers.google.com/maps/documentation/places/web-service/place-id)
   - Search for your business
   - Copy the Place ID

3. **Update Service Configuration**:
   - Open `src/app/services/google-reviews.service.ts`
   - Replace `YOUR_GOOGLE_PLACES_API_KEY` with your API key
   - Replace `YOUR_PLACE_ID` with your Place ID

```typescript
private readonly API_KEY = 'YOUR_ACTUAL_API_KEY';
private readonly PLACE_ID = 'YOUR_ACTUAL_PLACE_ID';
```

**Note**: Direct API calls from browser may face CORS issues. For production, use Option 2.

### Option 2: Backend Proxy (Recommended for Production)

1. **Create Backend Endpoint**:
   Create an API endpoint in your backend that proxies Google Places API requests:

```typescript
// Example NestJS endpoint
@Get('google-reviews')
async getGoogleReviews() {
  const placeId = process.env.GOOGLE_PLACE_ID;
  const apiKey = process.env.GOOGLE_API_KEY;
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=reviews&key=${apiKey}`;
  
  const response = await axios.get(url);
  return { reviews: response.data.result.reviews };
}
```

2. **Update Service**:
   Uncomment the backend proxy code in `google-reviews.service.ts`:

```typescript
// Use backend proxy instead of direct API call
return this.http.get<{ reviews: GoogleReview[] }>('/api/google-reviews').pipe(
  map(response => response.reviews),
  catchError(() => this.getFallbackReviews())
);
```

3. **Environment Variables**:
   Store API key and Place ID in backend environment variables (never expose in frontend).

## Features

- ✅ Fetches up to 6 reviews (configurable)
- ✅ Displays reviewer name, photo, rating, and text
- ✅ Shows relative time (e.g., "2 weeks ago")
- ✅ Fallback to hardcoded testimonials if API fails
- ✅ Loading spinner while fetching
- ✅ Error handling with graceful degradation

## API Response Format

The service expects Google Places API response format:

```json
{
  "result": {
    "reviews": [
      {
        "author_name": "John Doe",
        "author_url": "https://...",
        "profile_photo_url": "https://...",
        "rating": 5,
        "relative_time_description": "2 weeks ago",
        "text": "Great service!",
        "time": 1234567890
      }
    ]
  }
}
```

## Testing

1. **With API**: Reviews will load from Google
2. **Without API**: Fallback testimonials will display
3. **API Error**: Service automatically falls back to hardcoded reviews

## Security Notes

- ⚠️ **Never expose API keys in frontend code for production**
- ✅ Use backend proxy to keep API keys secure
- ✅ Restrict API key to specific domains/IPs
- ✅ Set up API key restrictions in Google Cloud Console

## Troubleshooting

### CORS Errors
- Use backend proxy instead of direct API calls
- Configure CORS on your backend server

### No Reviews Showing
- Check API key is valid
- Verify Place ID is correct
- Check browser console for errors
- Ensure Places API is enabled in Google Cloud Console

### Rate Limiting
- Google Places API has rate limits
- Consider caching reviews on backend
- Implement request throttling if needed

