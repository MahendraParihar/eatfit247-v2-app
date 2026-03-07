import { Injectable } from '@nestjs/common';
import { IRateQuoteWithPriority } from '@eatfit247-shared-lib';

@Injectable()
export class RateSelectorService {
  /**
   * Picks the best quote from all provider quotes.
   *
   * Sort order:
   *   1. priorityOrder ASC  — Nimbus (1) beats Shiprocket (2) at equal cost
   *   2. rateAmount ASC     — cheaper wins
   *   3. estimatedDays ASC  — faster wins on tie
   *   4. serviceName ASC    — stable deterministic tiebreak
   */
  public pickBestQuote<T extends IRateQuoteWithPriority>(quotes: T[]): T | null {
    if (quotes.length === 0) {
      return null;
    }

    return [...quotes].sort((a, b) => {
      // 1. Provider priority
      const priorityDiff = (a.priorityOrder ?? 99) - (b.priorityOrder ?? 99);
      if (priorityDiff !== 0) return priorityDiff;

      // 2. Rate amount
      if (a.rateAmount !== b.rateAmount) return a.rateAmount - b.rateAmount;

      // 3. Estimated delivery days
      const daysA = a.estimatedDays ?? Number.MAX_SAFE_INTEGER;
      const daysB = b.estimatedDays ?? Number.MAX_SAFE_INTEGER;
      if (daysA !== daysB) return daysA - daysB;

      // 4. Service name tiebreak
      return (a.serviceName ?? '').localeCompare(b.serviceName ?? '');
    })[0];
  }
}
