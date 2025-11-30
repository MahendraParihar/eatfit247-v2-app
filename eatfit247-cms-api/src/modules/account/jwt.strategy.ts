import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AccountService } from './account.service';
import { Env } from '../../util/env.values';
import { IAuthUser, StringResource, UserStatusEnum } from 'shared-lib';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private userService: AccountService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: Env.jwtSecret,
    });
  }

  async validate(payload: IAuthUser) {
    // Fix: JWT payload uses adminUserId, not userId
    const user = await this.userService.findOneById(payload.adminUserId);
    if (!user) {
      throw new UnauthorizedException('You are not authorized to perform the operation');
    }
    if (user.adminUserStatusId !== UserStatusEnum.ACTIVE) {
      throw new UnauthorizedException(StringResource.ADMIN_INACTIVE);
    }
    return {
      adminUserId: payload.adminUserId,
      emailId: payload.emailId,
    };
  }
}
