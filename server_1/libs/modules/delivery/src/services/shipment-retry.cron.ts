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
      // Cooperative cron claim — under multi-instance deploy the same row
      // may be returned by getRetryableShipments on two workers within the
      // claim's TTL window. tryClaim atomically updates retry_claimed_at and
      // returns false on the loser so only one worker proceeds.
      const claimed = await this.shipmentRecordService.tryClaim(shipment.shipmentId);
      if (!claimed) {
        this.logger.debug(
          `Shipment ${shipment.shipmentId} already claimed by another worker — skipping`,
        );
        continue;
      }
      try {
        await this.shipmentOrchestrationService.retryBooking(
          shipment.shipmentId,
          `cron-${shipment.shipmentId}-${Date.now()}`,
        );
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'unknown error';
        this.logger.error(`Retry failed for shipment ${shipment.shipmentId}: ${message}`);
      } finally {
        await this.shipmentRecordService.releaseClaim(shipment.shipmentId);
      }
    }
  }
}
