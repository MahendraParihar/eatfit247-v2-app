import { BadRequestException, CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GoogleService } from '../third-party';
import { RECAPTCHA_ACTION, RECAPTCHA_REQUIRED, RECAPTCHA_SCORE_THRESHOLD } from '@eatfit247-shared-lib';

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
 * The request headers should include a 'X-Recaptcha-Token' header.
 */
@Injectable()
export class RecaptchaGuard implements CanActivate {
  private readonly logger = new Logger(RecaptchaGuard.name);

  constructor(
    private reflector: Reflector,
    private googleService: GoogleService,
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
    // Get reCAPTCHA token from the request headers
    const recaptchaToken = request.headers['X-Recaptcha-Token'] || request.headers['x-recaptcha-token'];
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
      // Token is in headers, no need to remove from body
      return true;
    } catch (error: unknown) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      // Log the real reason server-side; never forward internal error details to the client.
      this.logger.error(
        'reCAPTCHA verification error',
        error instanceof Error ? error.stack : String(error),
      );
      throw new BadRequestException('reCAPTCHA verification failed. Please try again.');
    }
  }
}

