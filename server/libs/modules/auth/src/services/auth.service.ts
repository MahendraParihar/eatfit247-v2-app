import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { JwtService } from '@nestjs/jwt';
import {
  MstAdminUser,
  TxnAdminUserForgotPasswordOtp,
  TxnAdminLastLoginDetail,
  TxnAdminRefreshToken,
  TxnAdminPasswordResetToken,
} from '@server/common';
import {
  ILogin, IToken, IChangePassword, IForgotPasswordRequest, IResetPasswordRequest, IAuthUser,
} from 'eatfit247-shared-lib';
import { CryptoUtil, Env, CommonFunctionsUtil } from '@server/common';
import { UserStatusEnum } from '@server/common';
import { randomBytes } from 'node:crypto';
import moment from 'moment';

@Injectable()
export class AuthService {
  // In-memory rate limiting (use Redis in production)
  private loginAttempts = new Map<string, { count: number; lockoutUntil: Date | null }>();

  constructor(
    @InjectModel(MstAdminUser) private readonly adminRepository: typeof MstAdminUser,
    @InjectModel(TxnAdminUserForgotPasswordOtp) private readonly forgotPasswordOtpRepository: typeof TxnAdminUserForgotPasswordOtp,
    @InjectModel(TxnAdminLastLoginDetail) private readonly loginHistoryRepository: typeof TxnAdminLastLoginDetail,
    @InjectModel(TxnAdminRefreshToken) private readonly refreshTokenRepository: typeof TxnAdminRefreshToken,
    @InjectModel(TxnAdminPasswordResetToken) private readonly passwordResetTokenRepository: typeof TxnAdminPasswordResetToken,
    private jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string): Promise<IAuthUser> {
    const user = await this.adminRepository.findOne({ where: [{ emailId: username }] });
    if (!user || user.adminUserStatusId !== UserStatusEnum.ACTIVE) return null;
    const ok = await CryptoUtil.compareHash(password, user.password);
    return ok ? <IAuthUser>{
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
    } : null;
  }

  async findById(id: number): Promise<IAuthUser | null> {
    const user = await this.adminRepository.findOne({ where: [{ adminId: id }] });
    if (!user || user.adminUserStatusId !== UserStatusEnum.ACTIVE) return null;
    return <IAuthUser>{
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

  public async signIn(loginDto: ILogin, ipAddress: string, device: string): Promise<IToken> {
    const user: MstAdminUser = await this.findOneByEmail(loginDto.emailId);
    // // Check rate limiting
    // const rateLimitKey = `${loginDto.emailId}_${ipAddress}`;
    // const rateLimit = this.loginAttempts.get(rateLimitKey);
    // if (rateLimit?.lockoutUntil && rateLimit.lockoutUntil > new Date()) {
    //   const minutesLeft = Math.ceil(
    //     (rateLimit.lockoutUntil.getTime() - new Date().getTime()) / 60000,
    //   );
    //   throw new UnauthorizedException(
    //     `Account temporarily locked. Try again in ${minutesLeft} minute(s).`,
    //   );
    // }
    if (!user) {
      // this.recordFailedAttempt(rateLimitKey);
      throw new UnauthorizedException('Invalid email or password');
    }
    // Check account status
    if (user.adminUserStatusId === UserStatusEnum.VERIFICATION_PENDING) {
      throw new UnauthorizedException('Account not verified. Please verify your account first.');
    }
    if (user.adminUserStatusId === UserStatusEnum.IN_ACTIVE) {
      throw new UnauthorizedException(user.deactivationReason || 'Account is inactive');
    }
    // Verify password
    if (!loginDto.password || !user.password) {
      // this.recordFailedAttempt(rateLimitKey);
      throw new UnauthorizedException('Invalid email or password');
    }
    const isMatch = await CryptoUtil.compareHash(loginDto.password, user.password);
    if (!isMatch) {
      // this.recordFailedAttempt(rateLimitKey);
      throw new UnauthorizedException('Invalid email or password');
    }
    // Successful login - reset rate limiting
    // this.loginAttempts.delete(rateLimitKey);
    // Record login history
    await this.recordLoginHistory(user.adminId, ipAddress, device);
    // Generate tokens
    const jwtPayload = {
      emailId: user.emailId,
      adminUserId: user.adminId,
    };
    const accessToken = this.jwtService.sign(jwtPayload, {
      secret: Env.jwtSecret,
      expiresIn: Env.accessTokenTime as any,
    });
    const refreshToken = this.jwtService.sign(jwtPayload, {
      expiresIn: Env.refreshTokenTime as any,
      secret: Env.jwtRefreshSecret,
    });
    const refreshPlain = randomBytes(64).toString('hex');
    const refreshHash = await CryptoUtil.generateHash(refreshPlain, +Env.bcryptSaltRounds || 12);
    const expiresAt = moment().add(30, 'days').toDate();
    await this.refreshTokenRepository.create({
      adminId: user.adminId,
      tokenHash: refreshHash,
      expiresAt,
    });
    return <IToken>{
      accessToken,
      refreshToken,
    };
  }

  public async refreshToken(refreshToken: string): Promise<IToken> {
    try {
      // Verify refresh token with refresh secret
      const payload = this.jwtService.verify(refreshToken, { secret: Env.jwtRefreshSecret });
      // Verify the user still exists and is active
      const user = await this.findOneById(payload.adminUserId);
      if (!user || user.adminUserStatusId !== UserStatusEnum.ACTIVE) {
        throw new UnauthorizedException('User account is not active');
      }
      const jwtPayload = {
        emailId: payload.emailId,
        adminUserId: payload.adminUserId,
      };
      // Generate new tokens
      const accessToken = this.jwtService.sign(jwtPayload, {
        expiresIn: Env.accessTokenTime as any,
      });
      const newRefreshToken = this.jwtService.sign(jwtPayload, {
        expiresIn: Env.refreshTokenTime as any,
        secret: Env.jwtRefreshSecret,
      });
      return { accessToken, refreshToken: newRefreshToken };
    } catch (e) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  public async signOut(adminId: number, refreshToken?: string): Promise<void> {
    if (refreshToken) {
      // revoke specific token
      const tokens = await this.refreshTokenRepository.findAll({ where: { adminId: { id: adminId }, revoked: false } });
      for (const t of tokens) {
        const match = await CryptoUtil.compareHash(refreshToken, t.tokenHash);
        if (match) {
          await this.refreshTokenRepository.update({ revoked: true }, { where: { adminRefreshTokenId: t.adminRefreshTokenId } });
          return;
        }
      }
    }
    // else revoke all
    await this.refreshTokenRepository.update({ revoked: true }, { where: { adminId: adminId } });
  }

  public async forgotPassword(forgotPasswordDto: IForgotPasswordRequest, ipAddress: string): Promise<string> {
    const user: MstAdminUser = await this.findOneByEmail(forgotPasswordDto.emailId);
    if (!user) {
      throw new NotFoundException('Account not found');
    }
    if (user.adminUserStatusId === UserStatusEnum.VERIFICATION_PENDING) {
      throw new BadRequestException('Account not verified. Please verify your account first.');
    }
    if (user.adminUserStatusId === UserStatusEnum.IN_ACTIVE) {
      throw new BadRequestException(user.deactivationReason || 'Account is inactive');
    }
    // Inactivate previous OTPs
    await this.inactiveLastOtpByAdminId(user.adminId);
    // Generate new OTP
    const tokenPlain = randomBytes(32).toString('hex');
    const tokenHash = await CryptoUtil.generateHash(tokenPlain, +Env.bcryptSaltRounds || 12);
    const expiresAt = moment().add(Env.passwordResetExpirationMin, 'minutes').toDate();
    await this.passwordResetTokenRepository.create({
      adminId: user.adminId,
      tokenHash,
      expiresAt,
      createdIp: ipAddress,
    });
    // send email via EmailService (in libs/core/email)
    const resetLink = `http://localhost:4200/reset-password?token=${tokenPlain}&uid=${user.id}`;
    // this.emailService.sendReset(user.email, resetLink);
    return resetLink; // for dev; in prod don't return, just email
  }

  public async resetPassword(tokenPlain: string, newPassword: string, requestedIp: string): Promise<boolean> {
    const tokens = await this.passwordResetTokenRepository.findAll({ where: { used: false } });
    for (const t of tokens) {
      const ok = await CryptoUtil.compareHash(tokenPlain, t.tokenHash);
      if (!ok) continue;
      if (moment().isAfter(moment(t.expiresAt))) {
        t.used = true;
        await this.passwordResetTokenRepository.update({ used: true }, { where: { adminPasswordResetTokenId: t.adminPasswordResetTokenId } });
        throw new BadRequestException('Reset token expired');
      }
      // update user's password
      await this.passwordResetTokenRepository.update({ used: true }, { where: { adminPasswordResetTokenId: t.adminPasswordResetTokenId } });
      const pwHash = await CryptoUtil.generateHash(newPassword, +Env.bcryptSaltRounds || 12);
      await this.adminRepository.update({
        password: pwHash,
        modifiedIp: requestedIp,
      }, { where: { adminId: t.adminId } });
      // Revoke all refresh tokens
      await this.refreshTokenRepository.update({ revoked: true }, { where: { adminId: t.adminId } });
      return true;
    }
    // throw new BadRequestException('Invalid reset token');
    // const user: MstAdminUser = await this.findOneByEmail(resetPasswordDto.emailId);
    // if (!user) {
    //   throw new NotFoundException('Account not found');
    // }
    // if (resetPasswordDto.password !== resetPasswordDto.repeatPassword) {
    //   throw new BadRequestException('Passwords do not match');
    // }
    // // Validate password strength
    // this.validatePasswordStrength(resetPasswordDto.password);
    // // Verify OTP
    // const activeOtp = await this.findLastActiveOtp(user.adminId, resetPasswordDto.otp);
    // if (!activeOtp || activeOtp.otp !== resetPasswordDto.otp) {
    //   throw new BadRequestException('Invalid or expired OTP');
    // }
    // // Check OTP expiry (30 minutes)
    // const otpAge = Date.now() - activeOtp.createdAt.getTime();
    // const thirtyMinutes = 30 * 60 * 1000;
    // if (otpAge > thirtyMinutes) {
    //   throw new BadRequestException('OTP has expired. Please request a new one.');
    // }
    // // Hash new password
    // const hashedPassword = await CryptoUtil.generateHash(resetPasswordDto.password);
    // // Update password
    // await this.adminRepository.update(
    //   {
    //     password: hashedPassword,
    //     passwordTemp: hashedPassword,
    //     modifiedBy: user.adminId,
    //     modifiedIp: ipAddress,
    //   },
    //   {
    //     where: { adminId: user.adminId },
    //   },
    // );
    // // Inactivate OTP
    // await this.forgotPasswordOtpRepository.update(
    //   { active: false },
    //   { where: { forgotPasswordOtpId: activeOtp.forgotPasswordOtpId } },
    // );
  }

  public async changePassword(changePasswordDto: IChangePassword, adminId: number, ipAddress: string): Promise<void> {
    const user = await this.findOneById(adminId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (changePasswordDto.newPassword !== changePasswordDto.repeatPassword) {
      throw new BadRequestException('New passwords do not match');
    }
    // Validate password strength
    this.validatePasswordStrength(changePasswordDto.newPassword);
    // Verify current password
    const isMatch = await CryptoUtil.compareHash(changePasswordDto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Current password is incorrect');
    }
    // Hash new password
    const hashedPassword = await CryptoUtil.generateHash(changePasswordDto.newPassword);
    // Update password
    await this.adminRepository.update(
      {
        password: hashedPassword,
        passwordTemp: hashedPassword,
        modifiedBy: adminId,
        modifiedIp: ipAddress,
      },
      {
        where: { adminId: adminId },
      },
    );
  }

  public async findOneByEmail(emailId: string): Promise<MstAdminUser | null> {
    return await this.adminRepository.findOne({
      where: { emailId: emailId },
    });
  }

  public async findOneById(adminId: number): Promise<MstAdminUser | null> {
    return await this.adminRepository.findOne({
      where: { adminId: adminId },
    });
  }

  private async recordLoginHistory(adminId: number, ipAddress: string, device: string): Promise<void> {
    // Mark previous login as not latest
    await this.loginHistoryRepository.update(
      { isLatest: false },
      { where: { adminId: adminId, isLatest: true } },
    );
    // Create new login entry
    await this.loginHistoryRepository.create({
      adminId: adminId,
      deviceDetail: JSON.stringify({ userAgent: device }),
      lastLoginTimestamp: new Date(),
      isLatest: true,
      createdIp: ipAddress,
    });
  }

  private async inactiveLastOtpByAdminId(adminId: number): Promise<void> {
    await this.forgotPasswordOtpRepository.update(
      { active: false },
      { where: { adminId: adminId, active: true } },
    );
  }

  private async findLastActiveOtp(adminId: number, otp: string): Promise<TxnAdminUserForgotPasswordOtp | null> {
    return await this.forgotPasswordOtpRepository.findOne({
      where: {
        adminId: adminId,
        otp: otp,
        active: true,
      },
      order: [['createdAt', 'DESC']],
    });
  }

  private async sendForgotPasswordOtpEmail(user: MstAdminUser, otp: string): Promise<void> {
    try {
      // Find password reset email template (assuming template ID 1 or use a constant)
      // For now, we'll use a simple approach
      // Log OTP for now - email service can be integrated later
      console.log(`Password reset OTP for ${user.emailId}: ${otp}`);
    } catch (error) {
      // Log error but don't throw - OTP is already saved in database
      console.error('Failed to send forgot password OTP email:', error.message);
    }
  }

  private validatePasswordStrength(password: string): void {
    if (!password || password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters long');
    }
    if (password.length > 128) {
      throw new BadRequestException('Password must be less than 128 characters');
    }
    if (!/[A-Z]/.test(password)) {
      throw new BadRequestException('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      throw new BadRequestException('Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      throw new BadRequestException('Password must contain at least one number');
    }
    if (!/[#?!@$%^&*-]/.test(password)) {
      throw new BadRequestException('Password must contain at least one special character (#?!@$%^&*-)');
    }
  }

  private recordFailedAttempt(key: string): void {
    const current = this.loginAttempts.get(key) || { count: 0, lockoutUntil: null };
    current.count += 1;
    if (current.count >= Env.maxLoginAttempts) {
      current.lockoutUntil = new Date(
        Date.now() + Env.lockoutDurationMinutes * 60 * 1000,
      );
    }
    this.loginAttempts.set(key, current);
    // Clean up old entries
    if (this.loginAttempts.size > 1000) {
      const now = new Date();
      for (const [k, v] of this.loginAttempts.entries()) {
        if (v.lockoutUntil && v.lockoutUntil < now) {
          this.loginAttempts.delete(k);
        }
      }
    }
  }
}

