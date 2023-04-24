import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { AccountService } from './account.service';
import {
  AdminUserDTO,
  AuthAdminUserDTO,
  AuthAdminUserIdDTO,
  AuthAdminUserResetPasswordDTO,
} from './dto/admin-user.dto';
import { CryptoUtil } from '../../util/crypto-util';

@Controller('account')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Post('sign-in')
  async signIn(@Req() req: any, @Body() body: AuthAdminUserDTO) {
    body.emailId = CryptoUtil.decryptUsingAES256(body.emailId);
    body.password = CryptoUtil.decryptUsingAES256(body.password);
    return await this.accountService.login(body, req.ip, req.headers['user-agent']);
  }

  // @UseGuards(JwtAuthGuard)
  @Post('sign-up')
  async signUp(@Req() req: any, @Body() body: AdminUserDTO) {
    const tempUser: AdminUserDTO = body;
    tempUser.emailId = CryptoUtil.decryptUsingAES256(tempUser.emailId);
    tempUser.password = CryptoUtil.decryptUsingAES256(tempUser.password);
    return await this.accountService.signUp(tempUser);
  }

  // @UseGuards(JwtAuthGuard)
  @Get('verify-account')
  async verifyAccount(@Req() req: any) {
    return await this.accountService.verifyAccount(req.query.token, req.ip);
  }

  // @UseGuards(JwtAuthGuard)
  @Post('resend-verification-link')
  async resendVerificationLink(@Req() req: any, @Body() body: AuthAdminUserIdDTO) {
    body.emailId = CryptoUtil.decryptUsingAES256(body.emailId);
    return await this.accountService.resendVerificationOtp(body, req.ip);
  }

  // @UseGuards(JwtAuthGuard)
  @Post('send-forgot-password-otp')
  async sendForgotPasswordOtp(@Req() req: any, @Body() body: AuthAdminUserIdDTO) {
    body.emailId = CryptoUtil.decryptUsingAES256(body.emailId);
    return await this.accountService.sendForgotPasswordOtp(body, req.ip);
  }

  // @UseGuards(JwtAuthGuard)
  @Post('reset-password')
  async resetPassword(@Req() req: any, @Body() body: AuthAdminUserResetPasswordDTO) {
    body.emailId = CryptoUtil.decryptUsingAES256(body.emailId);
    body.password = CryptoUtil.decryptUsingAES256(body.password);
    body.repeatPassword = CryptoUtil.decryptUsingAES256(body.repeatPassword);
    return await this.accountService.resetPassword(body, req.ip);
  }
}
