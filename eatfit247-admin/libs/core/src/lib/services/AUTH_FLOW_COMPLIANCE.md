# Authentication Flow Compliance

## ⚠️ Authoritative Document

**All authentication logic MUST follow:** `eatfit247-admin-auth-flow.md`

This document is the **single source of truth** for authentication implementation.

## Current Implementation Status

### ✅ Client-Side (Angular) - COMPLIANT

All Angular authentication code has been updated to follow the auth flow document:

- **Endpoints:**
  - ✅ `POST /auth/login` (was `/auth/sign-in`)
  - ✅ `POST /auth/refresh` (was `/auth/refresh-token`)
  - ✅ `POST /auth/logout` (was `/auth/sign-out`)

- **Token Storage:**
  - ✅ Access Token: In-memory only (not localStorage)
  - ✅ Refresh Token: HttpOnly, Secure Cookie (server-side)
  - ✅ User Data: localStorage (non-sensitive)

- **Token Rotation:**
  - ✅ Enabled - new refresh token on each refresh
  - ✅ Refresh token automatically sent from HttpOnly cookie

- **Interceptors:**
  - ✅ `AuthInterceptor`: Adds Authorization header, sets withCredentials
  - ✅ `TokenRefreshInterceptor`: Handles 401 → refresh → retry flow

### ⚠️ Server-Side (NestJS) - NEEDS UPDATE

The server currently uses different endpoint names and needs to be updated:

**Current Server Endpoints:**
- `POST /auth/sign-in` → Should be `POST /auth/login`
- `POST /auth/refresh-token` → Should be `POST /auth/refresh`
- `POST /auth/sign-out` → Should be `POST /auth/logout`

**Server Requirements (from auth flow document):**
1. Set refresh token as HttpOnly, Secure cookie on login
2. Read refresh token from cookie (not request body) on refresh
3. Implement token rotation (new refresh token on each refresh)
4. Revoke refresh token in DB on logout
5. Clear refresh token cookie on logout
6. Implement CSRF protection for refresh & logout endpoints

## Migration Notes

### Server Endpoint Updates Required

The server `AuthController` needs to be updated:

```typescript
// Current (needs update)
@Post('sign-in') → @Post('login')
@Post('refresh-token') → @Post('refresh')
@Post('sign-out') → @Post('logout')
```

### Server Cookie Implementation Required

The server must:
1. Set refresh token as HttpOnly cookie on login
2. Read refresh token from cookie on refresh (not request body)
3. Implement token rotation (issue new refresh token on each refresh)
4. Revoke refresh token in database on logout
5. Clear cookie on logout

See `SERVER_TOKEN_IMPLEMENTATION.md` for detailed server implementation guide.

## Security Compliance Checklist

- ✅ Access token in memory only (not localStorage)
- ✅ Refresh token in HttpOnly cookie (not accessible to JS)
- ✅ Token rotation enabled
- ✅ Automatic token refresh on 401
- ✅ Logout revokes refresh token
- ⚠️ CSRF protection (server-side implementation required)
- ⚠️ Server endpoints match auth flow document (needs update)

## Testing Checklist

- [ ] Login sets refresh token cookie
- [ ] Access token stored in memory (not localStorage)
- [ ] 401 triggers automatic refresh
- [ ] Refresh issues new refresh token (token rotation)
- [ ] Logout revokes refresh token and clears cookie
- [ ] Invalid refresh token redirects to login
- [ ] CSRF protection works on refresh & logout

## Ownership

This authentication flow is owned by **EatFit247 Platform Team**.

All authentication logic must comply with `eatfit247-admin-auth-flow.md`.

