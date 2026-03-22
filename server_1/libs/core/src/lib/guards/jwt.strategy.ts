import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { IAuthUser } from '@eatfit247-shared-lib';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Env } from '../config/env.values';
import { AdminUserService } from '../auth/admin-user.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private adminUserService: AdminUserService) {
    if (!Env.jwtSecret) {
      throw new Error('JWT_ACCESS_SECRET is not configured');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: Env.jwtSecret,
    });
  }

  async validate(payload: any): Promise<IAuthUser> {
    const sessionUser = await this.adminUserService.findAuthUserForSession(payload.adminUserId);
    if (!sessionUser) {
      throw new UnauthorizedException('You are not authorized to perform the operation');
    }
    return sessionUser;
  }
}

