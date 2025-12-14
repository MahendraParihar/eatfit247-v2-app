# Secure Token Management Implementation

## Overview

This document describes the secure token management implementation following security best practices.

## Token Configuration

### Access Token
- **Type**: JWT
- **Expiry**: 10 minutes
- **Storage**: In-memory (Angular service) - **NOT localStorage**
- **Security**: Stored in memory only, cleared on page refresh/logout

### Refresh Token
- **Type**: JWT
- **Expiry**: 14 days
- **Storage**: HttpOnly, Secure Cookie (server-side)
- **Security**: Not accessible to JavaScript (XSS protection)

### Token Rotation
- **Enabled**: YES
- **Behavior**: New refresh token issued on each refresh
- **Security**: Prevents token reuse attacks

### Logout
- **Behavior**: Revokes refresh token on server
- **Client**: Clears in-memory access token and user data

## Implementation Details

### StorageService
- Access token stored in private class property (in-memory)
- Refresh token methods deprecated (handled by server cookie)
- User data stored in localStorage (non-sensitive)

### AuthService
- `signIn()`: Sets `withCredentials: true` to receive HttpOnly cookie
- `refreshToken()`: No refresh token parameter needed (from cookie)
- `signOut()`: Calls server to revoke refresh token cookie
- All auth endpoints use `withCredentials: true`

### HttpService
- Added `withCredentials` option to `HttpOptions` interface
- All HTTP methods support `withCredentials` for cookie handling

### TokenRefreshInterceptor
- Automatically refreshes access token on 401 errors
- Uses refresh token from HttpOnly cookie (sent automatically)
- Handles token rotation (new refresh token in cookie)

### AuthInterceptor
- Adds Authorization header with in-memory access token
- No changes needed for cookie handling (automatic)

## Server Requirements

The server must:
1. Set refresh token as HttpOnly, Secure cookie on sign-in
2. Accept refresh token from cookie (not request body) on refresh
3. Issue new refresh token on each refresh (token rotation)
4. Revoke refresh token cookie on sign-out
5. Set cookie with proper attributes:
   - `HttpOnly: true` (not accessible to JavaScript)
   - `Secure: true` (HTTPS only)
   - `SameSite: Strict` or `Lax` (CSRF protection)

## Security Benefits

1. **XSS Protection**: Refresh token in HttpOnly cookie cannot be accessed by JavaScript
2. **Token Rotation**: New refresh token on each refresh prevents reuse attacks
3. **Short-lived Access Tokens**: 10-minute expiry limits exposure window
4. **In-memory Storage**: Access token not persisted, cleared on refresh
5. **Automatic Revocation**: Server revokes refresh token on logout

## Migration Notes

- Old code using `localStorage` for tokens will need updates
- Components using `Observable` return types should migrate to `async/await`
- All API calls should use `HttpService` with `withCredentials: true` for auth endpoints

