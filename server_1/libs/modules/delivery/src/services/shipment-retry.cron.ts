import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ShipmentOrchestrationService } from './shipment-orchestration.service';
import { ShipmentRecordService } from './shipment-record.service';

@Injectable()
export class ShipmentRetryCron {
  private readonly logger = new Logger(ShipmentRetryCron.name);

  constructor(
    private readonly shipmentRecordService: ShipmentRecordService,
    private readonly shipmentOrchestrationService: ShipmentOrchestrationService,
  ) {}

  @Cron('*/5 * * * *')
  public async processPendingRetries(): Promise<void> {
    const pendingShipments = await this.shipmentRecordService.getRetryableShipments(25);
    if (pendingShipments.length === 0) {
      return;
    }

    this.logger.log(`Shipment retry cron picked ${pendingShipments.length} shipment(s)`);
    for (const shipment of pendingShipments) {
      try {
        await this.shipmentOrchestrationService.retryBooking(shipment.shipmentId, {
          idempotencyKey: `cron-${shipment.shipmentId}-${Date.now()}`,
        });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'unknown error';
        this.logger.error(
          `Retry failed for shipment ${shipment.shipmentId}: ${message}`,
        );
      }
    }
  }
}
