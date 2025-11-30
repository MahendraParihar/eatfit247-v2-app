import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { IToken, IAuthUser } from 'eatfit247-shared-lib';
import {
  JwtAuthGuard,
  CurrentUser,
  RequestedIp,
  PUBLIC_API,
} from '@server/common';
import { SetMetadata } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from '../services/auth.service';
import { ChangePasswordDto, ForgotPasswordDto, LoginDto, RefreshTokenDto, ResetPasswordDto } from '../dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(AuthGuard('local'))
  @Post('sign-in')
  async signIn(@Req() req: any, @Body() body: LoginDto): Promise<IToken> {
    const device = req.headers['user-agent'] || 'Unknown';
    return await this.authService.signIn(body, req.ip, device);
  }

  @SetMetadata(PUBLIC_API, true)
  @Post('refresh-token')
  async refreshToken(@Body() body: RefreshTokenDto): Promise<IToken> {
    return await this.authService.refreshToken(body.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Post('sign-out')
  async signOut(@CurrentUser() currentUser: IAuthUser): Promise<void> {
    await this.authService.signOut(currentUser.adminUserId || currentUser.adminId);
  }

  @SetMetadata(PUBLIC_API, true)
  @Post('forgot-password')
  async forgotPassword(@Req() req: any, @Body() body: ForgotPasswordDto): Promise<string> {
    return await this.authService.forgotPassword(body, req.ip);
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
    await this.authService.changePassword(body, currentUser.adminUserId || currentUser.adminId, req.ip);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@CurrentUser() currentUser: IAuthUser): Promise<IAuthUser> {
    const user = await this.authService.findOneById(currentUser.adminUserId || currentUser.adminId);
    if (!user) {
      throw new Error('User not found');
    }
    return {
      adminUserId: user.adminId,
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

