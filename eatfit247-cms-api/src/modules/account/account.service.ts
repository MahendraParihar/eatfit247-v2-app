import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import {
  AdminUserDTO,
  AuthAdminUserDTO,
  AuthAdminUserIdDTO,
  AuthAdminUserResetPasswordDTO,
} from './dto/admin-user.dto';
import { OTP_LENGTH } from '../../constants/config-constants';
import { JwtService } from '@nestjs/jwt';
import { UserStatusEnum, EmailTypeEnum, StringResource, IAdminUserLogin, IToken } from 'shared-lib';
import { Op } from 'sequelize';
import moment from 'moment';
import { MstAdminUser } from 'src/core/database/models/mst-admin-user.model';
import { TxnAdminLastLoginDetail } from '../../core/database/models/txn-admin-last-login-detail.model';
import { TxnAdminUserForgotPasswordOtp } from '../../core/database/models/txn-admin-user-forgot-password-otp.model';
import { InjectModel } from '@nestjs/sequelize';
import { CommonFunctionsUtil } from '../../util/common-functions-util';
import { Env } from '../../util/env.values';
import { IAuthUser, IChangePassword } from 'shared-lib';
import { CryptoUtil } from '../../util/crypto-util';
import { EmailService } from '../../core/mail/email.service';
import { IEmailParams } from '../../core/mail/email-params.interface';

@Injectable()
export class AccountService {
  constructor(
    @InjectModel(MstAdminUser)
    private readonly adminRepository: typeof MstAdminUser,
    @InjectModel(TxnAdminLastLoginDetail)
    private readonly adminLoginHistoryRepository: typeof TxnAdminLastLoginDetail,
    @InjectModel(TxnAdminUserForgotPasswordOtp)
    private readonly adminForgotPasswordRepository: typeof TxnAdminUserForgotPasswordOtp,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  // In-memory rate limiting (use Redis in production)
  private loginAttempts = new Map<string, { count: number; lockoutUntil: Date | null }>();

  public async login(authLoginDto: AuthAdminUserDTO, ipAddress: string, device: string): Promise<IAdminUserLogin> {
    const user: MstAdminUser = await this.findOneByEmail(authLoginDto.emailId);
    // Check rate limiting
    const rateLimitKey = `${authLoginDto.emailId}_${ipAddress}`;
    const rateLimit = this.loginAttempts.get(rateLimitKey);
    if (rateLimit?.lockoutUntil && rateLimit.lockoutUntil > new Date()) {
      const minutesLeft = Math.ceil(
        (rateLimit.lockoutUntil.getTime() - new Date().getTime()) / 60000,
      );
      throw new UnauthorizedException(
        `Account temporarily locked. Try again in ${minutesLeft} minute(s).`,
      );
    }
    if (!user) {
      this.recordFailedAttempt(rateLimitKey);
      throw new UnauthorizedException(StringResource.INVALID_USER);
    }
    // Check account status
    if (user.adminUserStatusId === UserStatusEnum.VERIFICATION_PENDING) {
      throw new UnauthorizedException(StringResource.ACOUNT_NOT_VERIFIED);
    }
    if (user.adminUserStatusId === UserStatusEnum.IN_ACTIVE) {
      throw new UnauthorizedException(user.deactivationReason || StringResource.ADMIN_INACTIVE);
    }
    // Verify password
    if (!authLoginDto.password || !user.password) {
      this.recordFailedAttempt(rateLimitKey);
      throw new UnauthorizedException(StringResource.INVALID_USER);
    }
    const isMatch = await CryptoUtil.compareHash(authLoginDto.password, user.password);
    if (!isMatch) {
      this.recordFailedAttempt(rateLimitKey);
      throw new UnauthorizedException(StringResource.INVALID_USER);
    }
    // Successful login - reset rate limiting
    this.loginAttempts.delete(rateLimitKey);
    // Record login
    const loginEntry = {
      adminId: user.adminId,
      createdIp: ipAddress,
      deviceDetail: device,
      lastLoginTimestamp: new Date(),
    };
    await this.createLoginEntry(loginEntry);
    // Generate tokens - JWT payload only needs minimal info
    const jwtPayload = {
      emailId: user.emailId,
      adminUserId: user.adminId,
    };
    const accessToken = this.jwtService.sign(jwtPayload, {
      expiresIn: Env.accessTokenTime as any,
    });
    // Use separate secret for refresh token
    const refreshToken = this.jwtService.sign(jwtPayload, {
      expiresIn: Env.refreshTokenTime as any,
      secret: Env.jwtRefreshSecret,
    });
    // Return user info for frontend
    const userInfo: IAuthUser = {
      emailId: user.emailId,
      adminUserId: user.adminId,
      firstName: user.firstName,
      lastName: user.lastName,
      profilePicture: (typeof user.profilePicture === 'string'
        ? JSON.parse(user.profilePicture || '{}')
        : user.profilePicture) || {},
      countryCode: user.countryCode,
      contactNumber: user.contactNumber,
    };
    return {
      accessToken,
      refreshToken,
      admin: userInfo,
    };
  }

  async refreshToken(token: string): Promise<IToken> {
    try {
      // Verify refresh token with refresh secret
      const payload = this.jwtService.verify(token, { secret: Env.jwtRefreshSecret });
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
      const refreshToken = this.jwtService.sign(jwtPayload, {
        expiresIn: Env.refreshTokenTime as any,
        secret: Env.jwtRefreshSecret,
      });
      return { accessToken, refreshToken };
    } catch (e) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async changePassword(
    changePasswordDto: IChangePassword,
    userId: number,
    ipAddress: string,
  ): Promise<void> {
    const adminUser = await this.adminRepository.findOne({
      where: {
        adminId: userId,
        adminUserStatusId: UserStatusEnum.ACTIVE,
      },
    });
    if (!adminUser) {
      throw new UnauthorizedException('User not found');
    }
    // Verify the current password
    const isCurrentPasswordMatch = await CryptoUtil.compareHash(
      changePasswordDto.password,
      adminUser.password,
    );
    if (!isCurrentPasswordMatch) {
      throw new UnauthorizedException('Current password is incorrect');
    }
    // Validate new password matches a repeat password
    if (changePasswordDto.newPassword !== changePasswordDto.repeatPassword) {
      throw new BadRequestException('New password and repeat password do not match');
    }
    // Validate password strength
    this.validatePasswordStrength(changePasswordDto.newPassword);
    // Check if new password is same as current
    const isSamePassword = await CryptoUtil.compareHash(
      changePasswordDto.newPassword,
      adminUser.password,
    );
    if (isSamePassword) {
      throw new BadRequestException('New password must be different from current password');
    }
    // Hash and update password
    const hashPassword = await CryptoUtil.generateHash(changePasswordDto.newPassword);
    await this.adminRepository.update(
      {
        password: hashPassword,
        modifiedIp: ipAddress,
        modifiedBy: userId,
      },
      {
        where: {
          adminId: userId,
        },
      },
    );
  }

  /**
   * Logout - invalidate tokens (client-side token removal)
   * In production, implement token blacklisting with Redis
   */
  async logout(userId: number): Promise<void> {
    // In production, add token to the blacklist
    // For now, a client will remove tokens from storage
    return Promise.resolve();
  }

  /**
   * Validate password strength
   */
  private validatePasswordStrength(password: string): void {
    if (!password || password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters long');
    }
    if (password.length > 128) {
      throw new BadRequestException('Password must be less than 128 characters');
    }
    // Check for at least one uppercase letter
    if (!/[A-Z]/.test(password)) {
      throw new BadRequestException('Password must contain at least one uppercase letter');
    }
    // Check for at least one lowercase letter
    if (!/[a-z]/.test(password)) {
      throw new BadRequestException('Password must contain at least one lowercase letter');
    }
    // Check for at least one number
    if (!/[0-9]/.test(password)) {
      throw new BadRequestException('Password must contain at least one number');
    }
    // Check for at least one special character
    if (!/[#?!@$%^&*-]/.test(password)) {
      throw new BadRequestException('Password must contain at least one special character (#?!@$%^&*-)');
    }
  }

  /**
   * Record failed login attempt and implement lockout
   */
  private recordFailedAttempt(key: string): void {
    const current = this.loginAttempts.get(key) || { count: 0, lockoutUntil: null };
    current.count += 1;
    if (current.count >= Env.maxLoginAttempts) {
      current.lockoutUntil = new Date(
        Date.now() + Env.lockoutDurationMinutes * 60 * 1000,
      );
    }
    this.loginAttempts.set(key, current);
    // Clean up old entries (simple cleanup - use Redis TTL in production)
    if (this.loginAttempts.size > 1000) {
      const now = new Date();
      for (const [k, v] of this.loginAttempts.entries()) {
        if (v.lockoutUntil && v.lockoutUntil < now) {
          this.loginAttempts.delete(k);
        }
      }
    }
  }

  public async signUp(user: AdminUserDTO): Promise<boolean> {
    const checkUser: MstAdminUser = await this.findOneByEmail(user.emailId);
    if (checkUser) {
      return true;
    }
    // if no password then generate new password
    // if (!user.password) {
    user.password = user.firstName.trim() + '@' + '123';
    // }
    const pass = await CryptoUtil.generateHash(user.password);
    user = { ...user, password: pass };
    // generate verification code
    user.verificationCode = CommonFunctionsUtil.generateRandomNumber(6);
    // create user if all good
    const tempUser = await this.createUser(user);
    if (!tempUser) {
      throw new Error(StringResource.SOMETHING_WENT_WRONG);
    }
    // tslint:disable-next-line: no-string-literal
    const { password, ...result } = tempUser['dataValues'];
    // generate token
    const token = await this.generateEmailConformationLink(tempUser.emailId, user.verificationCode);
    // deleting password from response object
    // delete result.password;
    /*if (user.address && user.cityVillageId) {
        const adminAddress: AddressDto = {
            addressTypeId: user.addressTypeId ? user.addressTypeId : AddressTypeEnum.PERMANENT_ADDRESS,
            address: user.address,
            cityVillageId: user.cityVillageId,
            countryId: user.countryId,
            pinCode: user.pinCode,
            tableId: TableEnum.MST_ADMIN,
            pkOfTable: tempUser.adminId,
            latitude: user.latitude ? user.latitude : null,
            longitude: user.longitude ? user.longitude : null
        };

        const adminAdd = await this.commonService.addAddress(adminAddress);
        if (adminAdd) {
            await this.adminRepository.update(
                {
                    addressId: adminAdd.addressId
                },
                {
                    where: {
                        adminId: tempUser.adminId
                    }
                });
        }
    }*/
    return true;
  }

  public async verifyAccount(token: string, cIP: string): Promise<boolean> {
    const toDecode = await this.jwtService.verify(token);
    const emailId = toDecode.emailId;
    const otp = toDecode.otp;
    const user: MstAdminUser | null = await this.findOneByEmail(emailId);
    if (!user) {
      throw new NotFoundException(StringResource.ACCOUNT_NOT_PRESENT);
    }
    switch (user.adminUserStatusId) {
      case UserStatusEnum.IN_ACTIVE:
        throw new NotFoundException(user.deactivationReason);
      case UserStatusEnum.VERIFICATION_PENDING:
        if (otp === user.verificationCode) {
          const update = await this.adminRepository.update(
            {
              verificationCode: null,
              modifiedIp: cIP,
              adminUserStatusId: UserStatusEnum.ACTIVE,
            },
            {
              where: {
                emailId: emailId,
                adminUserStatusId: UserStatusEnum.VERIFICATION_PENDING,
              },
            },
          );
          return !!update;
        } else {
          throw new Error(StringResource.INVALID_VERIFICATION_CODE);
        }
      case UserStatusEnum.ACTIVE:
      default:
        return true;
    }
  }

  public async resendVerificationOtp(authLoginDto: AuthAdminUserIdDTO, cIp: string): Promise<boolean> {
    const user: MstAdminUser | null = await this.findOneByEmail(authLoginDto.emailId);
    if (!user) {
      throw new NotFoundException(StringResource.ACCOUNT_NOT_PRESENT);
    }
    switch (user.adminUserStatusId) {
      case UserStatusEnum.IN_ACTIVE:
        throw new NotFoundException(user.deactivationReason);
      case UserStatusEnum.VERIFICATION_PENDING:
        const newOtp = CommonFunctionsUtil.generateRandomNumber(OTP_LENGTH);
        const update = await this.adminRepository.update(
          {
            verificationCode: newOtp,
            modifiedIp: cIp,
          },
          {
            where: {
              emailId: authLoginDto.emailId,
              adminUserStatusId: UserStatusEnum.VERIFICATION_PENDING,
            },
          },
        );
        if (update) {
          const token = await this.generateEmailConformationLink(authLoginDto.emailId, newOtp);
          return true;
        } else {
          return false;
        }
      case UserStatusEnum.ACTIVE:
      default:
        return true;
    }
  }

  public async sendForgotPasswordOtp(authLoginDto: AuthAdminUserIdDTO, cIp: string): Promise<boolean> {
    const user: MstAdminUser | null = await this.findOneByEmail(authLoginDto.emailId);
    if (!user) {
      throw new NotFoundException(StringResource.ACCOUNT_NOT_PRESENT);
    }
    switch (user.adminUserStatusId) {
      case UserStatusEnum.ACTIVE:
        // Generate OTP and send via mail
        await this.inactiveLastOtpByOtp(user.adminId);
        const otp = CommonFunctionsUtil.generateRandomNumber(OTP_LENGTH);
        const createObj = {
          adminId: user.adminId,
          otp: otp,
          createdIp: cIp,
        };
        console.log('createObj', createObj);
        const createEntry = await this.createForgotPasswordOtpEntry(createObj);
        if (createEntry) {
          // Send OTP via email
          await this.sendForgotPasswordOtpEmail(user, otp);
          return true;
        } else {
          return false;
        }
      case UserStatusEnum.VERIFICATION_PENDING:
        throw new BadRequestException(StringResource.ACOUNT_NOT_VERIFIED);
      case UserStatusEnum.IN_ACTIVE:
        throw new BadRequestException(user.deactivationReason);
    }
  }

  /**
   * Send forgot password OTP email
   */
  private async sendForgotPasswordOtpEmail(user: MstAdminUser, otp: string): Promise<void> {
    try {
      const emailParams: IEmailParams = {
        emailType: EmailTypeEnum.PASSWORD_RESET,
        toUserInfo: {
          name: `${user.firstName} ${user.lastName}`,
          emailId: user.emailId,
        },
        otp: otp,
        message: `Your OTP for password reset is: ${otp}. This OTP is valid for 30 minutes.`,
      };
      await this.emailService.sendEmail(emailParams);
    } catch (error) {
      // Log error but don't throw - OTP is already saved in database
      console.error('Failed to send forgot password OTP email:', error.message);
    }
  }

  public async resetPassword(authLoginDto: AuthAdminUserResetPasswordDTO, cIp: string): Promise<boolean> {
    const user: MstAdminUser | null = await this.findOneByEmail(authLoginDto.emailId);
    if (!user) {
      throw new NotFoundException(StringResource.ACCOUNT_NOT_PRESENT);
    }
    switch (user.adminUserStatusId) {
      case UserStatusEnum.ACTIVE:
        if (authLoginDto.password !== authLoginDto.repeatPassword) {
          throw new Error(StringResource.REPEAT_PASSWORD_NOT_MATCH);
        }
        const activeOtpObj = await this.findLastActiveOtp(user.adminId, authLoginDto.otp);
        if (activeOtpObj && activeOtpObj.otp !== authLoginDto.otp) {
          throw new Error(StringResource.INVALID_OTP);
        }
        const hashPassword = await CryptoUtil.generateHash(authLoginDto.password);
        const updateEntry = await this.adminRepository.update(
          {
            password: hashPassword,
            modifiedIp: cIp,
          },
          {
            where: {
              adminId: user.adminId,
              adminUserStatusId: UserStatusEnum.ACTIVE,
            },
          },
        );
        if (updateEntry) {
          await this.inactiveLastOtpByOtp(user.adminId);
          return true;
        } else {
          return false;
        }
      case UserStatusEnum.VERIFICATION_PENDING:
        return true;
      case UserStatusEnum.IN_ACTIVE:
        throw new Error(user.deactivationReason);
    }
  }

  public async findOneById(adminId: number): Promise<MstAdminUser | null> {
    return await this.adminRepository.findOne<MstAdminUser>({
      where: { adminId: adminId },
    });
  }

  public async findOneByEmail(emailId: string): Promise<MstAdminUser | null> {
    return await this.adminRepository.findOne<MstAdminUser>({
      where: { emailId: emailId },
    });
  }

  private async generateEmailConformationLink(emailId: string, randamNumber: string) {
    const payload = {
      emailId: emailId,
      otp: randamNumber,
    };
    const token = await this.jwtService.signAsync(payload);
    return token;
  }

  // create app user
  private async createUser(user) {
    return await this.adminRepository.create(user);
  }

  private async createLoginEntry(loginEntry: any) {
    await this.adminLoginHistoryRepository.create(loginEntry);
  }

  private async createForgotPasswordOtpEntry(forgotPasswordObj: any) {
    return await this.adminForgotPasswordRepository.create(forgotPasswordObj);
  }

  // inactive last forgot password otp by Otp
  private async inactiveLastOtpByOtp(appUserIdIn: number) {
    await this.adminForgotPasswordRepository.update(
      {
        active: false,
      },
      {
        where: {
          adminId: appUserIdIn,
          active: true,
        },
      },
    );
  }

  private async findLastActiveOtp(appUserIdIn: number, otpIn: string) {
    const fromDate = moment()
      .subtract(30 * 60, 'minute')
      .format();
    const toDate = moment().format();
    return this.adminForgotPasswordRepository.findOne<TxnAdminUserForgotPasswordOtp>({
      where: {
        adminId: appUserIdIn,
        active: true,
        otp: otpIn,
        createdAt: {
          [Op.between]: [fromDate, toDate],
        },
      },
    });
  }
}
