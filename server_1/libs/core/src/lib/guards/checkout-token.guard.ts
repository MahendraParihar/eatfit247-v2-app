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
/** `iat` (seconds) of the verified checkout token, set by CheckoutTokenGuard. */
export const CheckoutTokenIssuedAt = createParamDecorator(
  (_data: unknown, context: ExecutionContext): number | null =>
    context.switchToHttp().getRequest<Request & { checkoutTokenIssuedAt?: number | null }>()
      .checkoutTokenIssuedAt ?? null,
);

/**
 * A checkout token can be obtained by anyone who knows a member's email or phone, so it
 * only reaches records created in its own session. Allows for small clock skew.
 */
export function checkoutSessionStart(issuedAtSeconds: number | null): Date {
  const SKEW_MS = 5 * 60 * 1000;
  return issuedAtSeconds ? new Date(issuedAtSeconds * 1000 - SKEW_MS) : new Date();
}

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
    // Lets routes limit a session to records created after the token was issued
    (request as Request & { checkoutTokenIssuedAt: number | null }).checkoutTokenIssuedAt =
      payload.iat ?? null;

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
