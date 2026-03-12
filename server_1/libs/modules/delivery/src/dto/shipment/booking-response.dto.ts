export class BookingResponseDto {
  shipmentId!: number;
  shipmentNumber!: string;
  status!: string;
  courierProviderId?: number;
  providerAccountId?: number;
  providerShipmentId?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  labelUrl?: string;
  awbNumber?: string;
  message?: string;
  retryCount?: number;
  nextRetryAt?: Date;
  metadata?: Record<string, unknown>;
}
