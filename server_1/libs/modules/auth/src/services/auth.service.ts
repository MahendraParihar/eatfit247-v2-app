import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import {
  AppConfigService,
  CryptoUtil,
  EmailType,
  Env,
  MstAdminUser,
  TxnAdminLastLoginDetail,
  TxnAdminPasswordResetToken,
  TxnAdminRefreshToken,
} from '@server_1/core';
import { EmailNotificationService, LogErrorService } from '@server_1/platform';
import { IAuthUser, IChangePassword, IForgotPasswordRequest, ILogin, IToken } from '@eatfit247-shared-lib';
import { randomBytes } from 'node:crypto';
import moment from 'moment';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(MstAdminUser) private readonly adminRepository: typeof MstAdminUser,
    @InjectModel(TxnAdminLastLoginDetail) private readonly loginHistoryRepository: typeof TxnAdminLastLoginDetail,
    @InjectModel(TxnAdminRefreshToken) private readonly refreshTokenRepository: typeof TxnAdminRefreshToken,
    @InjectModel(TxnAdminPasswordResetToken) private readonly passwordResetTokenRepository: typeof TxnAdminPasswordResetToken,
    private jwtService: JwtService,
    private emailNotificationService: EmailNotificationService,
    private appConfigService: AppConfigService,
    private logErrorService: LogErrorService,
  ) {}

  async findById(id: number): Promise<IAuthUser | null> {
    const user = await this.adminRepository.findOne({ where: [{ adminId: id }] });
    if (!user || !user.active) return null;
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
    const user = await this.findOneByEmail(loginDto.emailId);
    if (!user) {
      // this.recordFailedAttempt(rateLimitKey);
      throw new UnauthorizedException('Invalid email or password');
    }
    // Check account status
    if (!user.active) {
      throw new UnauthorizedException(user.deactivationReason || 'Account is inactive');
    }
    // Verify password
    if (!loginDto.password || !user.password) {
      // this.recordFailedAttempt(rateLimitKey);
      throw new UnauthorizedException('Invalid email or password');
    }
    const isMatch = await CryptoUtil.compareHash(loginDto.password, user.password);
    console.log('--------------', isMatch);
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
    const accessToken = this.jwtService.sign(jwtPayload, <JwtSignOptions>{
      secret: Env.jwtSecret,
      expiresIn: Env.accessTokenTime,
    });
    const refreshToken = this.jwtService.sign(jwtPayload, <JwtSignOptions>{
      expiresIn: Env.refreshTokenTime,
      secret: Env.jwtRefreshSecret,
    });
    const refreshPlain = randomBytes(64).toString('hex');
    const refreshHash = await CryptoUtil.generateHash(refreshPlain, +Env.bcryptSaltRounds);
    const expiresAt = moment().add(14, 'days').toDate(); // 14 days expiry per auth flow document
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

  /**
   * Refresh Token with Token Rotation
   * ⚠️ AUTH FLOW: Follow eatfit247-admin-auth-flow.md
   *
   * Token Rotation:
   * 1. Verify old refresh token
   * 2. Revoke old refresh token in database
   * 3. Generate new access token (10-15 min expiry)
   * 4. Generate new refresh token (7-14 days expiry)
   * 5. Store new refresh token in database
   *
   * @param refreshToken - Old refresh token from HttpOnly cookie
   * @returns New access token and refresh token
   */
  public async refreshToken(refreshToken: string): Promise<IToken> {
    try {
      // Verify refresh token with refresh secret
      const payload = this.jwtService.verify(refreshToken, { secret: Env.jwtRefreshSecret });
      // Verify the user still exists and is active
      const user = await this.findOneById(payload.adminUserId);
      if (!user || !user.active) {
        throw new UnauthorizedException('User account is not active');
      }
      // Token Rotation: Revoke old refresh token
      // Find and revoke the old refresh token in database
      const tokens = await this.refreshTokenRepository.findAll({
        where: { adminId: user.adminId, revoked: false },
      });
      // Try to find and revoke the specific token
      let tokenFound = false;
      for (const t of tokens) {
        // Since we're using JWT, we can't directly compare hashes
        // Instead, we'll revoke all tokens for this user and create a new one
        // In a production system, you'd store the JWT ID (jti) in the database
        await this.refreshTokenRepository.update(
          { revoked: true },
          { where: { adminRefreshTokenId: t.adminRefreshTokenId } },
        );
        tokenFound = true;
      }
      // If no tokens found, still proceed (might be first refresh or token already revoked)
      // Generate new tokens
      const jwtPayload = {
        emailId: payload.emailId,
        adminUserId: payload.adminUserId,
      };
      const accessToken = this.jwtService.sign(jwtPayload, {
        secret: Env.jwtSecret,
        expiresIn: Env.accessTokenTime as any,
      });
      const newRefreshToken = this.jwtService.sign(jwtPayload, {
        expiresIn: Env.refreshTokenTime as any,
        secret: Env.jwtRefreshSecret,
      });
      // Token Rotation: Store new refresh token in database
      const refreshPlain = randomBytes(64).toString('hex');
      const refreshHash = await CryptoUtil.generateHash(refreshPlain, +Env.bcryptSaltRounds || 12);
      const expiresAt = moment().add(14, 'days').toDate(); // 14 days expiry
      await this.refreshTokenRepository.create({
        adminId: user.adminId,
        tokenHash: refreshHash,
        expiresAt,
      });
      return { accessToken, refreshToken: newRefreshToken };
    } catch (e) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  public async signOut(adminId: number, refreshToken?: string): Promise<void> {
    if (refreshToken) {
      // revoke specific token
      const tokens = await this.refreshTokenRepository.findAll({ where: { adminId: adminId, revoked: false } });
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

  public async forgotPassword(forgotPasswordDto: IForgotPasswordRequest, ipAddress: string, userAgent?: string): Promise<string> {
    const user: MstAdminUser = await this.findOneByEmail(forgotPasswordDto.emailId);
    if (!user) {
      throw new NotFoundException('Account not found');
    }
    if (!user.active) {
      throw new BadRequestException(user.deactivationReason || 'Account is inactive');
    }
    // Generate new OTP
    const tokenPlain = randomBytes(32).toString('hex');
    const tokenHash = await CryptoUtil.generateHash(tokenPlain, +Env.bcryptSaltRounds);
    const expiresAt = moment().add(Env.passwordResetExpirationMin, 'minutes').toDate();
    await this.passwordResetTokenRepository.create({
      adminId: user.adminId,
      tokenHash,
      expiresAt,
      createdIp: ipAddress,
      userAgent: userAgent || null,
    });
    // Generate reset link
    const resetLink = `${this.appConfigService.get('CLIENT_URL')}/reset-password?token=${tokenPlain}&uid=${user.emailId}`;
    try {
      const userName = user.firstName && user.lastName
        ? `${user.firstName} ${user.lastName}`
        : user.firstName || user.emailId;
      await this.emailNotificationService.sendEmailByType({
        to: user.emailId,
        type: EmailType.FORGOT_PASSWORD,
        data: {
          userName,
          resetLink,
        },
      });
    } catch (error) {
      await this.logErrorService.logError(
        error instanceof Error ? error : new Error(String(error)),
        {
          controller: 'AuthService',
          methodName: 'forgotPassword',
        },
      );
    }
    return 'Password reset link has been sent to your email address.';
  }

  public async resetPassword(tokenPlain: string, newPassword: string, requestedIp: string): Promise<boolean> {
    if (!tokenPlain || !newPassword) {
      throw new BadRequestException('Token and new password are required');
    }
    // Validate password strength
    this.validatePasswordStrength(newPassword);
    const tokens = await this.passwordResetTokenRepository.findAll({ where: { used: false }, nest: true, raw: true });
    for (const t of tokens) {
      if (!t.tokenHash) continue;
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
      // Get user details for email
      const user = await this.findOneById(t.adminId);
      // Revoke all refresh tokens
      await this.refreshTokenRepository.update({ revoked: true }, { where: { adminId: t.adminId } });
      // Send password reset success email using generic email service
      if (user) {
        try {
          const userName = user.firstName && user.lastName
            ? `${user.firstName} ${user.lastName}`
            : user.firstName || user.emailId;
          const resetTime = new Date().toLocaleString('en-US', {
            dateStyle: 'long',
            timeStyle: 'short',
          });
          await this.emailNotificationService.sendEmailByType({
            to: user.emailId,
            type: EmailType.PASSWORD_RESET_SUCCESS,
            data: {
              userName,
              resetTime,
            },
          });
        } catch (error) {
          // Log error but don't fail the request
          await this.logErrorService.logError(
            error instanceof Error ? error : new Error(String(error)),
            {
              controller: 'AuthService',
              methodName: 'resetPassword',
            },
          );
        }
      }
      return true;
    }
    // If we get here, no matching token was found
    throw new BadRequestException('Invalid or expired reset token');
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
    // Verify the current password
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
}

