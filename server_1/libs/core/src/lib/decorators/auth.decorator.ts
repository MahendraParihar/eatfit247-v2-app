import { PUBLIC_API, RECAPTCHA_ACTION, RECAPTCHA_REQUIRED, RECAPTCHA_SCORE_THRESHOLD } from '@eatfit247-shared-lib';
import { SetMetadata } from '@nestjs/common';

export const Public = () => SetMetadata(PUBLIC_API, true);
/**
 * Decorator to require reCAPTCHA verification for an endpoint
 * @param action - Optional: Expected action name (e.g., 'contact_form_submit')
 * @param scoreThreshold - Optional: Minimum score threshold (default: 0.5)
 */
export const RequireRecaptcha = (
  action?: string,
  scoreThreshold: number = 0.5,
) => {
  return (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) => {
    if (descriptor) {
      SetMetadata(RECAPTCHA_REQUIRED, true)(target, propertyKey, descriptor);
      if (action) {
        SetMetadata(RECAPTCHA_ACTION, action)(target, propertyKey, descriptor);
      }
      SetMetadata(RECAPTCHA_SCORE_THRESHOLD, scoreThreshold)(
        target,
        propertyKey,
        descriptor,
      );
    }
  };
};

