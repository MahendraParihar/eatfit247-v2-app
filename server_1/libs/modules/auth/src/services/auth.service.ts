import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import {
  AdminUserService,
  AppConfigService,
  CommonFunctionsUtil,
  CryptoUtil,
  Env,
  MstAdminUser,
  TxnAdminLastLoginDetail,
  TxnAdminPasswordResetToken,
  TxnAdminRefreshToken,
} from '@server_1/core';
import { EmailNotificationService } from '@server_1/platform';
import {
  ConfigParam,
  EmailTemplateEnum,
  IAuthUser,
  IChangePassword,
  IAdminUserLogin,
  IForgotPasswordRequest,
  ILogin,
  ISendEmailParams,
  IToken,
} from '@eatfit247-shared-lib';
import { randomBytes, randomUUID } from 'node:crypto';
import moment from 'moment';
import { Op } from 'sequelize';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectModel(MstAdminUser) private readonly adminRepository: typeof MstAdminUser,
    @InjectModel(TxnAdminLastLoginDetail)
    private readonly loginHistoryRepository: typeof TxnAdminLastLoginDetail,
    @InjectModel(TxnAdminRefreshToken)
    private readonly refreshTokenRepository: typeof TxnAdminRefreshToken,
    @InjectModel(TxnAdminPasswordResetToken)
    private readonly passwordResetTokenRepository: typeof TxnAdminPasswordResetToken,
    private jwtService: JwtService,
    private emailNotificationService: EmailNotificationService,
    private appConfigService: AppConfigService,
    private readonly sessionAdminUserService: AdminUserService,
  ) {}

  async findById(id: number): Promise<IAuthUser | null> {
    return this.sessionAdminUserService.findAuthUserForSession(id);
  }

  public async signIn(loginDto: ILogin, ipAddress: string, device: string): Promise<IAdminUserLogin> {
    const user = await this.findOneByEmail(loginDto.emailId);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }
    if (!user.active) {
      throw new UnauthorizedException(user.deactivationReason || 'Account is inactive');
    }
    if (!loginDto.password || !user.password) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const isMatch = await CryptoUtil.compareHash(loginDto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }
    await this.recordLoginHistory(user.adminId, ipAddress, device);
    // Each refresh token gets a unique JWT ID (jti) stored in the DB.
    // This allows revocation of a single device session without affecting others.
    const jti = randomUUID();
    const jwtPayload = {
      emailId: user.emailId,
      adminUserId: user.adminId,
      jti,
    };
    const accessToken = this.jwtService.sign({ emailId: user.emailId, adminUserId: user.adminId }, <
      JwtSignOptions
    >{ secret: Env.jwtSecret, expiresIn: Env.accessTokenTime });
    const refreshToken = this.jwtService.sign(jwtPayload, <JwtSignOptions>{
      expiresIn: Env.refreshTokenTime,
      secret: Env.jwtRefreshSecret,
    });
    const expiresAt = moment().add(14, 'days').toDate();
    // tokenHash column repurposed to store jti — direct equality lookup,
    // no bcrypt comparison needed (JWT signature is the proof of authenticity).
    await this.refreshTokenRepository.create({
      adminId: user.adminId,
      tokenHash: jti,
      expiresAt,
    });
    // Load enriched user with roles, permissions, and franchise scope
    const admin = await this.sessionAdminUserService.findAuthUserForSession(user.adminId);

    return { accessToken, refreshToken, admin: admin! };
  }

  /**
   * Refresh Token with Token Rotation.
   *
   * 1. Verify the incoming refresh JWT (signature + expiry).
   * 2. Extract its jti and find the exact DB row — rejects reused/stolen tokens.
   * 3. Revoke ONLY that row (other device sessions are untouched).
   * 4. Issue new access + refresh tokens (new jti) and persist the new DB row.
   */
  public async refreshToken(refreshToken: string): Promise<IToken> {
    let payload: { jti?: string; adminUserId?: number; emailId?: string };
    try {
      payload = this.jwtService.verify(refreshToken, { secret: Env.jwtRefreshSecret });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const { jti, adminUserId, emailId } = payload;
    if (!jti || !adminUserId) {
      // Token predates the jti scheme — reject and force re-login
      throw new UnauthorizedException('Invalid refresh token format. Please log in again.');
    }

    // Look up the exact token record by jti
    const tokenRecord = await this.refreshTokenRepository.findOne({
      where: { adminId: adminUserId, tokenHash: jti, revoked: false },
    });
    if (!tokenRecord) {
      // Token was already revoked or never existed — possible token reuse attack
      this.logger.warn(`Refresh token not found or already revoked for adminId=${adminUserId}`);
      throw new UnauthorizedException('Refresh token has already been used or revoked.');
    }
    if (moment().isAfter(moment(tokenRecord.expiresAt))) {
      await this.refreshTokenRepository.update(
        { revoked: true },
        { where: { adminRefreshTokenId: tokenRecord.adminRefreshTokenId } },
      );
      throw new UnauthorizedException('Refresh token has expired. Please log in again.');
    }

    // Verify the user is still active
    const user = await this.findById(adminUserId);
    if (!user) {
      throw new UnauthorizedException('User account is not active');
    }

    // Revoke the consumed token
    await this.refreshTokenRepository.update(
      { revoked: true },
      { where: { adminRefreshTokenId: tokenRecord.adminRefreshTokenId } },
    );

    // Issue new tokens with a fresh jti
    const newJti = randomUUID();
    const accessToken = this.jwtService.sign(
      { emailId, adminUserId },
      { secret: Env.jwtSecret, expiresIn: Env.accessTokenTime as any },
    );
    const newRefreshToken = this.jwtService.sign(
      { emailId, adminUserId, jti: newJti },
      { expiresIn: Env.refreshTokenTime as any, secret: Env.jwtRefreshSecret },
    );
    await this.refreshTokenRepository.create({
      adminId: adminUserId,
      tokenHash: newJti,
      expiresAt: moment().add(14, 'days').toDate(),
    });

    return { accessToken, refreshToken: newRefreshToken };
  }

  /**
   * Sign out.
   *
   * Preferred path: extract the jti from the refresh JWT and revoke only
   * that one row — other devices stay logged in.
   * Fallback: if the token is absent, expired, or predates the jti scheme,
   * revoke every token for this user (safe but logs out all devices).
   */
  public async signOut(adminId: number, refreshToken?: string): Promise<void> {
    if (refreshToken) {
      try {
        const payload = this.jwtService.verify(refreshToken, {
          secret: Env.jwtRefreshSecret,
        }) as { jti?: string };
        if (payload?.jti) {
          await this.refreshTokenRepository.update(
            { revoked: true },
            { where: { adminId, tokenHash: payload.jti } },
          );
          return;
        }
      } catch {
        // Expired or invalid refresh JWT — fall through to revoke-all
      }
    }
    await this.refreshTokenRepository.update({ revoked: true }, { where: { adminId } });
  }

  public async forgotPassword(
    forgotPasswordDto: IForgotPasswordRequest,
    ipAddress: string,
    userAgent?: string,
  ): Promise<string> {
    const user: MstAdminUser = await this.findOneByEmail(forgotPasswordDto.emailId);
    if (!user || !user.active) {
      return 'If that email is registered, a reset link has been sent.';
    }
    // Invalidate any existing unused tokens for this user before issuing a new one.
    // This keeps at most 1 active token per user, so resetPassword() always
    // bcrypt-compares against exactly 1 row instead of a growing unbounded set.
    await this.passwordResetTokenRepository.update(
      { used: true },
      { where: { adminId: user.adminId, used: false } },
    );

    // Generate new reset token
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
    const resetLink = `${this.appConfigService.get(
      ConfigParam.CLIENT_URL,
    )}/reset-password?token=${tokenPlain}&uid=${user.emailId}`;
    try {
      const userName =
        user.firstName && user.lastName
          ? `${user.firstName} ${user.lastName}`
          : user.firstName || user.emailId;
      // Use franchiseId from user, default to 1 if not set
      const franchiseId = user.franchiseId;
      const expiryHours = Math.ceil((Env.passwordResetExpirationMin || 60) / 60);
      await this.emailNotificationService.sendEmail(<ISendEmailParams>{
        emailTemplate: EmailTemplateEnum.ADMIN_FORGOT_PASSWORD,
        to: user.emailId,
        franchiseBranding: { brandName: '', logoUrl: '' },
        replacements: {
          adminEmail: user.emailId,
          adminName: userName,
          resetUrl: resetLink,
          expiryHours: expiryHours,
        },
      });
    } catch (error) {
      // Log error but don't fail the request - password reset token is already created
      this.logger.error('Failed to send password reset email', { error });
    }
    return 'Password reset link has been sent to your email address.';
  }

  /**
   * Reset password.
   *
   * Security properties:
   * - Accepts the user's emailId alongside the token so we can scope the DB
   *   lookup to a single user (O(1) query + O(1) bcrypt).  The previous
   *   implementation loaded ALL unused tokens for ALL users and scanned them
   *   linearly — O(n) bcrypt operations, a DoS vector.
   * - forgotPassword() now invalidates previous tokens before creating a new
   *   one, guaranteeing at most 1 active token per user at any time.
   * - Expired-token check is done in the query (Op.gt) before bcrypt runs.
   */
  public async resetPassword(
    tokenPlain: string,
    emailId: string,
    newPassword: string,
    requestedIp: string,
  ): Promise<boolean> {
    if (!tokenPlain || !emailId || !newPassword) {
      throw new BadRequestException('Token, email, and new password are required');
    }

    this.validatePasswordStrength(newPassword);

    // Resolve the user first — narrows every subsequent query to one adminId
    const user = await this.findOneByEmail(emailId);
    if (!user) {
      // Return the same generic error as a missing token to avoid user enumeration
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Load only non-expired, unused tokens for this specific user.
    // After the forgotPassword() change there should be exactly 1 row here.
    const candidates = await this.passwordResetTokenRepository.findAll({
      where: {
        adminId: user.adminId,
        used: false,
        expiresAt: { [Op.gt]: new Date() },
      },
      raw: true,
      nest: true,
    });

    if (candidates.length === 0) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Verify token against the (typically single) candidate
    let matchedToken: TxnAdminPasswordResetToken | null = null;
    for (const t of candidates) {
      if (!t.tokenHash) continue;
      const ok = await CryptoUtil.compareHash(tokenPlain, t.tokenHash);
      if (ok) {
        matchedToken = t;
        break;
      }
    }

    if (!matchedToken) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Mark token as consumed
    await this.passwordResetTokenRepository.update(
      { used: true },
      { where: { adminPasswordResetTokenId: matchedToken.adminPasswordResetTokenId } },
    );

    // Update the password
    const pwHash = await CryptoUtil.generateHash(newPassword, +Env.bcryptSaltRounds || 12);
    await this.adminRepository.update(
      { password: pwHash, modifiedIp: requestedIp },
      { where: { adminId: user.adminId } },
    );

    // Revoke all active sessions — force re-login on all devices
    await this.refreshTokenRepository.update(
      { revoked: true },
      { where: { adminId: user.adminId } },
    );

    // Send confirmation email (non-blocking)
    try {
      const userName =
        user.firstName && user.lastName
          ? `${user.firstName} ${user.lastName}`
          : user.firstName || user.emailId;
      const clientUrl = this.appConfigService.get(ConfigParam.CLIENT_URL);
      await this.emailNotificationService.sendEmail(<ISendEmailParams>{
        emailTemplate: EmailTemplateEnum.ADMIN_PASSWORD_CHANGED,
        to: user.emailId,
        franchiseBranding: { brandName: '', logoUrl: '' },
        replacements: {
          adminEmail: user.emailId,
          adminName: userName,
          changeDate: new Date().toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' }),
          ipAddress: requestedIp,
          loginUrl: clientUrl ? `${clientUrl}/login` : undefined,
        },
      });
    } catch (error) {
      this.logger.error('Failed to send password reset success email', { error });
    }

    return true;
  }

  public async changePassword(
    changePasswordDto: IChangePassword,
    adminId: number,
    ipAddress: string,
  ): Promise<void> {
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

  private async recordLoginHistory(
    adminId: number,
    ipAddress: string,
    device: string,
  ): Promise<void> {
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
      throw new BadRequestException(
        'Password must contain at least one special character (#?!@$%^&*-)',
      );
    }
  }
}
