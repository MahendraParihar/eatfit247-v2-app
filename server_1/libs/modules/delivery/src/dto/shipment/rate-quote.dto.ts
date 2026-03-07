import { IRateQuote } from '@eatfit247-shared-lib';

export class RateQuoteDto implements IRateQuote {
  rateQuoteId?: number;
  providerId!: number;
  providerName?: string;
  serviceId?: number;
  serviceCode!: string;
  serviceName!: string;
  rateAmount!: number;
  currency!: string;
  estimatedDays?: number;
  estimatedDeliveryDate?: Date;
  metadata?: Record<string, unknown>;
  providerAccountId?: number;
  isSelected?: boolean;
}
