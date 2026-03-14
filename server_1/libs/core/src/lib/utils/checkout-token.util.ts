import * as jwt from 'jsonwebtoken';
import { Env } from '../config/env.values';

const CHECKOUT_TOKEN_TYPE = 'checkout';

export interface ICheckoutTokenPayload {
  /** memberId */
  sub: number;
  type: typeof CHECKOUT_TOKEN_TYPE;
  iat?: number;
  exp?: number;
}

/**
 * Utility for signing and verifying short-lived checkout session tokens.
 *
 * These tokens are issued by POST /member/create and must be included as
 * "Authorization: Bearer <token>" on every member-scoped checkout endpoint.
 * They carry the memberId so the CheckoutTokenGuard can enforce that the
 * memberId in the URL matches the one the token was issued for.
 *
 * Keys come from env vars — never hardcode them.
 */
export class CheckoutTokenUtil {
  private static get secret(): string {
    const s = Env.checkoutTokenSecret;
    if (!s) {
      throw new Error(
        '[CheckoutTokenUtil] Missing required environment variable: CHECKOUT_TOKEN_SECRET',
      );
    }
    return s;
  }

  static sign(memberId: number): string {
    const expiresIn = (Env.checkoutTokenExpiry ?? '24h') as jwt.SignOptions['expiresIn'];
    return jwt.sign({ sub: memberId, type: CHECKOUT_TOKEN_TYPE }, this.secret, { expiresIn });
  }

  /**
   * Returns the payload if the token is valid and is a checkout token.
   * Returns null on any failure (expired, bad signature, wrong type).
   */
  static verify(token: string): ICheckoutTokenPayload | null {
    try {
      const payload = jwt.verify(token, this.secret) as unknown as ICheckoutTokenPayload;
      if (payload.type !== CHECKOUT_TOKEN_TYPE) return null;
      return payload;
    } catch {
      return null;
    }
  }
}
