import { BadRequestException, CanActivate, ExecutionContext, Inject, Injectable, Optional } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RECAPTCHA_ACTION, RECAPTCHA_REQUIRED, RECAPTCHA_SCORE_THRESHOLD } from '../decorators/auth.decorator';
// Using string token to avoid circular dependency with platform
const GOOGLE_SERVICE_TOKEN = 'GoogleService';

// Type definition to avoid importing from platform
interface IGoogleService {
  verifyRecaptchaV3(token: string, remoteIp?: string, scoreThreshold?: number): Promise<{ success: boolean; score?: number; action?: string; errorCodes?: string[] }>;
  verifyRecaptchaV3WithAction(token: string, expectedAction: string, remoteIp?: string, scoreThreshold?: number): Promise<{ success: boolean; score?: number; action?: string }>;
}

/**
 * reCAPTCHA Guard
 * 
 * This guard verifies reCAPTCHA tokens for endpoints decorated with @RequireRecaptcha().
 * 
 * Usage:
 * @RequireRecaptcha('contact_form_submit', 0.5)
 * @Post('contact')
 * async submitContact(@Body() body: ContactDto) { ... }
 * 
 * The request body should include a 'recaptchaToken' field.
 */
@Injectable()
export class RecaptchaGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @Optional() @Inject(GOOGLE_SERVICE_TOKEN) private googleService?: IGoogleService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const handler = context.getHandler();
    const controller = context.getClass();

    // Check if reCAPTCHA is required for this endpoint
    const isRecaptchaRequired = this.reflector.getAllAndOverride<boolean>(
      RECAPTCHA_REQUIRED,
      [handler, controller],
    );

    if (!isRecaptchaRequired) {
      // reCAPTCHA not required for this endpoint
      return true;
    }

    if (!this.googleService) {
      throw new BadRequestException(
        'GoogleService is not available. Please ensure PlatformModule is imported.',
      );
    }

    // Get reCAPTCHA token from the request body
    const recaptchaToken = request.body?.recaptchaToken;

    if (!recaptchaToken) {
      throw new BadRequestException('reCAPTCHA token is required');
    }

    // Get optional configuration from decorator
    const expectedAction = this.reflector.getAllAndOverride<string>(
      RECAPTCHA_ACTION,
      [handler, controller],
    );

    const scoreThreshold = this.reflector.getAllAndOverride<number>(
      RECAPTCHA_SCORE_THRESHOLD,
      [handler, controller],
    ) || 0.5;

    // Get client IP address
    const remoteIp =
      request.ip ||
      request.headers['x-forwarded-for']?.split(',')[0] ||
      request.connection?.remoteAddress;

      try {
      // Verify reCAPTCHA token using GoogleService
      if (expectedAction) {
        await this.googleService.verifyRecaptchaV3WithAction(
          recaptchaToken,
          expectedAction,
          remoteIp,
          scoreThreshold,
        );
      } else {
        await this.googleService.verifyRecaptchaV3(
          recaptchaToken,
          remoteIp,
          scoreThreshold,
        );
      }

      // Remove token from body after verification (security best practice)
      delete request.body.recaptchaToken;

      return true;
    } catch (error: any) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        `reCAPTCHA verification failed: ${error.message}`,
      );
    }
  }
}

