/**
 * Auth Controller
 *
 * ⚠️ AUTH FLOW: Follow eatfit247-admin-auth-flow.md (authoritative)
 *
 * Endpoints:
 * - POST /auth/login (was /auth/sign-in)
 * - POST /auth/refresh (was /auth/refresh-token)
 * - POST /auth/logout (was /auth/sign-out)
 *
 * Refresh token is stored in HttpOnly, Secure cookie (not in response body)
 */
import { Body, Controller, Get, Post, Req, Res, SetMetadata, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { IAuthUser, IToken, PUBLIC_API } from '@eatfit247-shared-lib';
import { CurrentUser, Env, JwtAuthGuard, RequestedIp } from '@server_1/core';
import { AuthService } from '../services/auth.service';
import { ChangePasswordDto, ForgotPasswordDto, LoginDto, ResetPasswordDto } from '../dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Login - POST /auth/login
   * ⚠️ AUTH FLOW: Follow eatfit247-admin-auth-flow.md
   * Sets refresh token as HttpOnly, Secure cookie
   * Returns access token in response body
   */
  @SetMetadata(PUBLIC_API, true)
  @Post('login')
  async signIn(
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
    @Body() body: LoginDto,
  ): Promise<IToken> {
    const device = req.headers['user-agent'] || 'Unknown';
    const tokens = await this.authService.signIn(body, req.ip, device);
    // Set refresh token as HttpOnly, Secure cookie
    const isProduction = Env.nodeEnv === 'production';
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true, // Not accessible to JavaScript (XSS protection)
      secure: isProduction, // HTTPS only in production
      sameSite: 'strict', // CSRF protection
      maxAge: 14 * 24 * 60 * 60 * 1000, // 14 days in milliseconds
      path: '/',
    });
    // Return only access token (refresh token is in cookie)
    // Note: IToken requires refreshToken, but we're storing it in HttpOnly cookie
    // The client should not receive refreshToken in response body for security
    return {
      accessToken: tokens.accessToken,
      refreshToken: '', // Empty string - refresh token is in HttpOnly cookie
    };
  }

  /**
   * Refresh Token - POST /auth/refresh
   * ⚠️ AUTH FLOW: Follow eatfit247-admin-auth-flow.md
   * Reads refresh token from HttpOnly cookie
   * Implements token rotation (new refresh token on each refresh)
   * Returns new access token in response body
   */
  @SetMetadata(PUBLIC_API, true)
  @Post('refresh')
  async refreshToken(
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
  ): Promise<IToken> {
    // Read refresh token from HttpOnly cookie
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      throw new Error('Refresh token not found');
    }
    // Refresh token with rotation (old token revoked, new token issued)
    const tokens = await this.authService.refreshToken(refreshToken);
    // Set new refresh token as HttpOnly cookie (token rotation)
    const isProduction = Env.nodeEnv === 'production';
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 14 * 24 * 60 * 60 * 1000, // 14 days
      path: '/',
    });
    // Return only access token (new refresh token is in cookie)
    // Note: IToken requires refreshToken, but we're storing it in HttpOnly cookie
    // The client should not receive refreshToken in response body for security
    return {
      accessToken: tokens.accessToken,
      refreshToken: '', // Empty string - refresh token is in HttpOnly cookie
    };
  }

  /**
   * Logout - POST /auth/logout
   * ⚠️ AUTH FLOW: Follow eatfit247-admin-auth-flow.md
   * Revokes refresh token in database
   * Clears refresh token cookie
   */
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async signOut(
    @CurrentUser() currentUser: IAuthUser,
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    const refreshToken = req.cookies?.refreshToken;
    // Revoke refresh token in database
    await this.authService.signOut(
      currentUser.adminId,
      refreshToken,
    );
    // Clear refresh token cookie
    const isProduction = Env.nodeEnv === 'production';
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      path: '/',
    });
  }

  @SetMetadata(PUBLIC_API, true)
  @Post('forgot-password')
  async forgotPassword(@Req() req: any, @Body() body: ForgotPasswordDto): Promise<string> {
    const userAgent = req.headers['user-agent'] || null;
    return await this.authService.forgotPassword(body, req.ip, userAgent);
  }

  @SetMetadata(PUBLIC_API, true)
  @Post('reset-password')
  async resetPassword(@Req() req: any, @Body() body: ResetPasswordDto, @RequestedIp() requestedIp: string): Promise<boolean> {
    return await this.authService.resetPassword(body.token, body.newPassword, requestedIp);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  async changePassword(
    @CurrentUser() currentUser: IAuthUser,
    @Req() req: any,
    @Body() body: ChangePasswordDto,
  ): Promise<void> {
    await this.authService.changePassword(body, currentUser.adminId, req.ip);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@CurrentUser() currentUser: IAuthUser): Promise<IAuthUser> {
    const user = await this.authService.findOneById(currentUser.adminId);
    if (!user) {
      throw new Error('User not found');
    }
    return {
      adminId: user.adminId,
      emailId: user.emailId,
      firstName: user.firstName,
      lastName: user.lastName,
      profilePicture: typeof user.profilePicture === 'string'
        ? JSON.parse(user.profilePicture || '{}')
        : user.profilePicture || {},
      countryCode: user.countryCode,
      contactNumber: user.contactNumber,
    };
  }
}

