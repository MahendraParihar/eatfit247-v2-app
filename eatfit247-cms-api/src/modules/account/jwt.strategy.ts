import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AccountService } from './account.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private userService: AccountService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWTKEY,
    });
  }

  async validate(payload: { userId: number }) {
    const user = await this.userService.findOneById(payload.userId);
    if (!user) {
      throw new UnauthorizedException('You are not authorized to perform the operation');
    }
    return {
      userId: payload.userId,
    };
  }
}
