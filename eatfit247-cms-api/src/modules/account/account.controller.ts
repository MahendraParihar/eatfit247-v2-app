import { BadRequestException, Body, Controller, Get, Post, Req } from '@nestjs/common';
import { AccountService } from './account.service';
import {
  AdminUserDTO,
  AuthAdminUserDTO,
  AuthAdminUserIdDTO,
  AuthAdminUserResetPasswordDTO,
} from './dto/admin-user.dto';
import { CryptoUtil } from '../../util/crypto-util';
import { Public } from './decorator/auth.decorator';
import { CurrentUser } from './decorator/user.decorator';
import { IAuthUser, IChangePassword } from 'shared-lib';

@Controller('account')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Public()
  @Post('sign-in')
  async signIn(@Req() req: any, @Body() body: AuthAdminUserDTO) {
    try {
      body.emailId = CryptoUtil.decryptApiData(body.emailId);
      body.password = CryptoUtil.decryptApiData(body.password);
      
      // Validate decrypted data
      if (!body.emailId || !body.password) {
        throw new BadRequestException('Invalid encrypted data');
      }
      
      return await this.accountService.login(body, req.ip, req.headers['user-agent']);
    } catch (error) {
      if (error.message && error.message.includes('decrypt')) {
        throw new BadRequestException('Invalid encrypted data format');
      }
      throw error;
    }
  }

  @Public()
  @Post('sign-up')
  async signUp(@Req() req: any, @Body() body: AdminUserDTO) {
    const tempUser: AdminUserDTO = body;
    tempUser.emailId = CryptoUtil.decryptApiData(tempUser.emailId);
    tempUser.password = CryptoUtil.decryptApiData(tempUser.password);
    return await this.accountService.signUp(tempUser);
  }

  @Public()
  @Get('verify-account')
  async verifyAccount(@Req() req: any) {
    return await this.accountService.verifyAccount(req.query.token, req.ip);
  }

  @Public()
  @Post('resend-verification-link')
  async resendVerificationLink(@Req() req: any, @Body() body: AuthAdminUserIdDTO) {
    body.emailId = CryptoUtil.decryptApiData(body.emailId);
    return await this.accountService.resendVerificationOtp(body, req.ip);
  }

  @Public()
  @Post('send-forgot-password-otp')
  async sendForgotPasswordOtp(@Req() req: any, @Body() body: AuthAdminUserIdDTO) {
    body.emailId = CryptoUtil.decryptApiData(body.emailId);
    return await this.accountService.sendForgotPasswordOtp(body, req.ip);
  }

  @Public()
  @Post('reset-password')
  async resetPassword(@Req() req: any, @Body() body: AuthAdminUserResetPasswordDTO) {
    body.emailId = CryptoUtil.decryptApiData(body.emailId);
    body.password = CryptoUtil.decryptApiData(body.password);
    body.repeatPassword = CryptoUtil.decryptApiData(body.repeatPassword);
    return await this.accountService.resetPassword(body, req.ip);
  }

  @Public()
  @Post('refresh-token')
  async refresh(@Body() body: { refreshToken: string }): Promise<{ accessToken: string; refreshToken: string }> {
    return await this.accountService.refreshToken(body.refreshToken);
  }

  @Get('profile')
  async getProfile(@CurrentUser() currentUser: IAuthUser) {
    return await this.accountService.findOneById(currentUser.adminUserId);
  }

  @Post('change-password')
  async changePassword(
    @CurrentUser() currentUser: IAuthUser,
    @Req() req: any,
    @Body() body: IChangePassword,
  ) {
    body.password = CryptoUtil.decryptApiData(body.password);
    body.newPassword = CryptoUtil.decryptApiData(body.newPassword);
    body.repeatPassword = CryptoUtil.decryptApiData(body.repeatPassword);
    return await this.accountService.changePassword(body, currentUser.adminUserId, req.ip);
  }

  @Post('logout')
  async logout(@CurrentUser() currentUser: IAuthUser) {
    return await this.accountService.logout(currentUser.adminUserId);
  }
}
