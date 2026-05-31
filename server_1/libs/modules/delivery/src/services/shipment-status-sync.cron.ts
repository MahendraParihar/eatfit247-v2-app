import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ShipmentOrchestrationService } from './shipment-orchestration.service';
import { ShipmentRecordService } from './shipment-record.service';

/**
 * Webhook fallback. Polls non-terminal shipments against the carrier so missed
 * webhooks (server was down, carrier never fired, async cancel queued by
 * Shiprocket etc.) eventually get reconciled. trackShipment() already routes
 * the response through saveTrackingEvents → flips local status and emits
 * `shipment.status.changed`, so this cron just has to call it.
 */
@Injectable()
export class ShipmentStatusSyncCron {
  private readonly logger = new Logger(ShipmentStatusSyncCron.name);

  constructor(
    private readonly shipmentRecordService: ShipmentRecordService,
    private readonly shipmentOrchestrationService: ShipmentOrchestrationService,
  ) {}

  @Cron('*/15 * * * *')
  public async syncShipmentStatuses(): Promise<void> {
    const candidates = await this.shipmentRecordService.getStatusSyncCandidates(50);
    if (candidates.length === 0) return;

    this.logger.log(`Status-sync cron picked ${candidates.length} shipment(s)`);
    for (const shipment of candidates) {
      try {
        await this.shipmentOrchestrationService.trackShipment(shipment.shipmentId);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'unknown error';
        this.logger.warn(
          `Status sync failed for shipment ${shipment.shipmentId} (AWB ${
            shipment.trackingNumber ?? '?'
          }): ${message}`,
        );
      }
    }
  }
}
