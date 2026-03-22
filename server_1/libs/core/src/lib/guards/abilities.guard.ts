import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IAbilityCheck, IAuthUser, REQUIRE_ABILITY } from '@eatfit247-shared-lib';
import { CaslAbilityFactory } from '../auth/casl-ability.factory';

@Injectable()
export class AbilitiesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly caslAbilityFactory: CaslAbilityFactory,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const check = this.reflector.getAllAndOverride<IAbilityCheck | undefined>(REQUIRE_ABILITY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!check) {
      return true;
    }
    const request = context.switchToHttp().getRequest<{ user?: IAuthUser }>();
    const user = request.user;
    if (!user) {
      throw new ForbiddenException();
    }
    const ability = this.caslAbilityFactory.createForUser(user);
    if (!ability.can(check.action, check.subject)) {
      throw new ForbiddenException();
    }
    return true;
  }
}
