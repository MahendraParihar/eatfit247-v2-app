import {
  CanActivate,
  createParamDecorator,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { CheckoutTokenUtil } from '../utils/checkout-token.util';

/**
 * Guard for public checkout endpoints that have no user login.
 *
 * When POST /member/create succeeds it returns a signed checkout token
 * (see CheckoutTokenUtil.sign). The frontend stores that token and sends it
 * as "Authorization: Bearer <token>" on every subsequent checkout request.
 *
 * This guard:
 *   1. Extracts the token from the Authorization header.
 *   2. Verifies its signature and expiry.
 *   3. When the route contains a :memberId param, ensures it matches the
 *      memberId embedded in the token — preventing one user from touching
 *      another member's data.
 *
 * Attach to any checkout route that operates on a specific member:
 *   @UseGuards(CheckoutTokenGuard)
 */
@Injectable()
export class CheckoutTokenGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    const token = this.extractToken(request);
    if (!token) {
      throw new UnauthorizedException(
        'A valid checkout token is required. Please start your session via POST /member/create.',
      );
    }

    const payload = CheckoutTokenUtil.verify(token);
    if (!payload) {
      throw new UnauthorizedException('Invalid or expired checkout token. Please try again.');
    }

    // When the route carries :memberId, it must match the token's subject.
    const rawMemberId = request.params['memberId'];
    if (rawMemberId !== undefined) {
      const routeMemberId = parseInt(rawMemberId, 10);
      if (isNaN(routeMemberId) || payload.sub !== routeMemberId) {
        throw new ForbiddenException('Checkout token does not match the requested member.');
      }
    }

    // Expose the verified memberId downstream (controllers can read it via @Req())
    (request as Request & { checkoutMemberId: number }).checkoutMemberId = payload.sub;
    // Records created in this checkout session carry this id (public invoice downloads match it)
    (request as Request & { checkoutSessionId: string | null }).checkoutSessionId =
      payload.jti ?? null;

    return true;
  }

  private extractToken(request: Request): string | null {
    const authHeader = request.headers['authorization'];
    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      return authHeader.slice(7);
    }
    return null;
  }
}

/**
 * The verified checkout token's session id (jti), set by CheckoutTokenGuard; null for
 * tokens issued before session ids existed.
 *
 * A checkout token can be obtained by anyone who knows a member's email or phone, so
 * public reads of earlier records must be limited to the session that created them.
 */
export const CheckoutSessionId = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string | null =>
    context.switchToHttp().getRequest<Request & { checkoutSessionId?: string | null }>()
      .checkoutSessionId ?? null,
);
