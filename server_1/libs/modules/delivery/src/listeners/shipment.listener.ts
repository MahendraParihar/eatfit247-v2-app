import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ShipmentOrchestrationService } from '../services';

export interface OrderProductPaidPayload {
  memberProductId: number;
  createdBy: number | null;
  createdIp: string;
}

@Injectable()
export class ShipmentListener {
  private readonly logger = new Logger(ShipmentListener.name);

  constructor(private readonly shipmentOrchestrationService: ShipmentOrchestrationService) {}

  @OnEvent('order.product.paid')
  async handleOrderProductPaid(payload: OrderProductPaidPayload): Promise<void> {
    this.logger.log(`Received order.product.paid event for order ${payload.memberProductId}`);
    try {
      setImmediate(() => {
        this.shipmentOrchestrationService
          .initiateFromOrder(payload.memberProductId, payload.createdBy, payload.createdIp)
          .catch((err) =>
            this.logger.error(
              `Failed to initiate shipment for order ${payload.memberProductId}`,
              err,
            ),
          );
      });
    } catch (error: any) {
      this.logger.error(
        `Error handling order.product.paid for order ${payload.memberProductId}: ${error.message}`,
        error.stack,
      );
    }
  }
}
