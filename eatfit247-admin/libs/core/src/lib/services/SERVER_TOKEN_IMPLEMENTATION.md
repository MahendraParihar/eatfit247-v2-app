# Server-Side Token Implementation Requirements

## Overview

This document outlines the server-side requirements for implementing secure token management with HttpOnly cookies and token rotation.

## Token Configuration

### Access Token
- **Type**: JWT
- **Expiry**: 10 minutes
- **Storage**: Returned in response body (client stores in memory)
- **Usage**: Sent in `Authorization: Bearer <token>` header

### Refresh Token
- **Type**: JWT
- **Expiry**: 14 days
- **Storage**: HttpOnly, Secure Cookie (server-side)
- **Usage**: Automatically sent by browser with requests

## Server Implementation Requirements

### 1. Sign-In Endpoint (`POST /api/v2/admin/auth/sign-in`)

**Response:**
- Set refresh token as HttpOnly, Secure cookie
- Return access token in response body

**Cookie Configuration:**
```typescript
res.cookie('refreshToken', refreshToken, {
  httpOnly: true,        // Not accessible to JavaScript
  secure: true,          // HTTPS only
  sameSite: 'strict',     // CSRF protection
  maxAge: 14 * 24 * 60 * 60 * 1000, // 14 days in milliseconds
  path: '/',
});
```

**Response Body:**
```typescript
{
  accessToken: string,  // JWT token (10 min expiry)
  // refreshToken is NOT in response body (it's in cookie)
}
```

### 2. Refresh Token Endpoint (`POST /api/v2/admin/auth/refresh-token`)

**Request:**
- Read refresh token from HttpOnly cookie (not request body)
- Validate refresh token
- Revoke old refresh token (if token rotation is enabled)

**Response:**
- Issue new access token (10 min expiry)
- Issue new refresh token (14 days expiry) in HttpOnly cookie
- Return access token in response body

**Token Rotation:**
- Generate new refresh token on each refresh
- Invalidate/revoke old refresh token
- Set new refresh token cookie

**Response Body:**
```typescript
{
  accessToken: string,  // New JWT token (10 min expiry)
  // New refreshToken is set in HttpOnly cookie, not in response
}
```

### 3. Sign-Out Endpoint (`POST /api/v2/admin/auth/sign-out`)

**Request:**
- Read refresh token from HttpOnly cookie
- Revoke refresh token in database

**Response:**
- Clear refresh token cookie
- Return success

**Cookie Clearing:**
```typescript
res.clearCookie('refreshToken', {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
  path: '/',
});
```

### 4. CORS Configuration

**Required Headers:**
```typescript
app.enableCors({
  origin: true, // Or specific origins in production
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true, // CRITICAL: Required for HttpOnly cookies
});
```

## Security Best Practices

1. **HttpOnly Cookie**: Prevents XSS attacks (JavaScript cannot access)
2. **Secure Flag**: Ensures cookie only sent over HTTPS
3. **SameSite**: Prevents CSRF attacks
4. **Token Rotation**: New refresh token on each refresh prevents reuse
5. **Short Access Token**: 10-minute expiry limits exposure window
6. **Automatic Revocation**: Old refresh tokens invalidated on rotation

## Example NestJS Implementation

```typescript
// In auth.controller.ts
@Post('sign-in')
async signIn(@Req() req: any, @Body() body: LoginDto, @Res() res: Response): Promise<void> {
  const tokens = await this.authService.signIn(body, req.ip, req.headers['user-agent']);
  
  // Set refresh token as HttpOnly cookie
  res.cookie('refreshToken', tokens.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 14 * 24 * 60 * 60 * 1000, // 14 days
    path: '/',
  });
  
  // Return access token in response body
  res.json({ accessToken: tokens.accessToken });
}

@Post('refresh-token')
async refreshToken(@Req() req: any, @Res() res: Response): Promise<void> {
  // Read refresh token from cookie
  const refreshToken = req.cookies?.refreshToken;
  
  if (!refreshToken) {
    throw new UnauthorizedException('Refresh token not found');
  }
  
  // Validate and rotate token
  const tokens = await this.authService.refreshToken(refreshToken);
  
  // Set new refresh token cookie (token rotation)
  res.cookie('refreshToken', tokens.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 14 * 24 * 60 * 60 * 1000,
    path: '/',
  });
  
  // Return new access token
  res.json({ accessToken: tokens.accessToken });
}

@Post('sign-out')
async signOut(@Req() req: any, @Res() res: Response): Promise<void> {
  const refreshToken = req.cookies?.refreshToken;
  
  if (refreshToken) {
    // Revoke refresh token in database
    await this.authService.revokeRefreshToken(refreshToken);
  }
  
  // Clear refresh token cookie
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  });
  
  res.json({ success: true });
}
```

## Testing

1. **Sign-In**: Verify refresh token cookie is set with correct attributes
2. **Refresh**: Verify new refresh token cookie is set (token rotation)
3. **Sign-Out**: Verify refresh token cookie is cleared
4. **CORS**: Verify `credentials: true` allows cookie transmission

