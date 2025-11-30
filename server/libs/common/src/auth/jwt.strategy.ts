import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { IAuthUser } from 'eatfit247-shared-lib';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Env } from '../utils/env.values';
import { AdminUserService } from './admin-user.service';
import { UserStatusEnum } from '../enum/user-status.enum';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(public adminUserService: AdminUserService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: Env.jwtSecret,
    });
  }

  async validate(payload: any): Promise<IAuthUser> {
    const adminUser = await this.adminUserService.findById(payload.adminUserId);
    if (!adminUser) {
      throw new UnauthorizedException('You are not authorized to perform the operation');
    }
    if (adminUser.adminUserStatusId !== UserStatusEnum.ACTIVE) {
      throw new UnauthorizedException('Account is not active');
    }
    return <IAuthUser>{
      emailId: payload.emailId,
      adminUserId: payload.adminUserId,
      adminId: payload.adminUserId,
      contactNumber: adminUser.contactNumber,
      profilePicture: typeof adminUser.profilePicture === 'string'
        ? JSON.parse(adminUser.profilePicture || '{}')
        : adminUser.profilePicture || {},
      countryCode: adminUser.countryCode,
      firstName: adminUser.firstName,
      lastName: adminUser.lastName,
    };
  }
}

