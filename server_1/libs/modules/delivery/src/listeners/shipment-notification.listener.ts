import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectModel } from '@nestjs/sequelize';
import { NotificationChannel, NotificationType, ShipmentStatusEnum } from '@eatfit247-shared-lib';
import { EmailNotificationService } from '@server_1/platform';
import { TxnMemberProduct } from '@server_1/modules/member/models';
import { NotificationService } from '@server_1/modules/notification';
import { MstCourierProvider } from '../models';
import { IShipmentStatusChangedEvent } from '../services/shipment-record.service';

/**
 * Member-facing notifications for shipment milestones.
 *
 * Listens to 'shipment.status.changed' (emitted by ShipmentRecordService) and
 * dispatches email + WhatsApp via the existing notification infrastructure.
 *
 * Template rows must exist in mst_email_templates with template_name:
 *   - member_shipment_booked
 *   - member_shipment_out_for_delivery
 *   - member_shipment_delivered
 * (Other statuses are ignored — we don't notify on DRAFT/RATE_REQUESTED/FAILED/etc.)
 */
@Injectable()
export class ShipmentNotificationListener {
  private readonly logger = new Logger(ShipmentNotificationListener.name);

  private static readonly STATUS_TEMPLATE: Record<string, string> = {
    [ShipmentStatusEnum.BOOKED]: 'member_shipment_booked',
    [ShipmentStatusEnum.OUT_FOR_DELIVERY]: 'member_shipment_out_for_delivery',
    [ShipmentStatusEnum.DELIVERED]: 'member_shipment_delivered',
  };

  constructor(
    @InjectModel(TxnMemberProduct)
    private readonly orderRepository: typeof TxnMemberProduct,
    @InjectModel(MstCourierProvider)
    private readonly courierProviderRepository: typeof MstCourierProvider,
    private readonly notificationService: NotificationService,
    private readonly emailNotificationService: EmailNotificationService,
  ) {}

  @OnEvent('shipment.status.changed')
  async handle(payload: IShipmentStatusChangedEvent): Promise<void> {
    const templateCode = ShipmentNotificationListener.STATUS_TEMPLATE[payload.newStatus];
    if (!templateCode) return; // Status we don't notify on

    try {
      // Fetch order + member contact in one go via the 'details' scope.
      const order = await this.orderRepository.scope('details').findOne({
        where: { memberProductId: payload.orderId },
      });
      if (!order || !order.member) {
        this.logger.warn(
          `Skipping ${templateCode} for shipment ${payload.shipmentId}: order ${payload.orderId} not found`,
        );
        return;
      }

      // Provider name is optional — best-effort lookup.
      let providerName = '';
      try {
        const providerId = (order as unknown as { courierProviderId?: number }).courierProviderId;
        if (providerId) {
          const provider = await this.courierProviderRepository.findByPk(providerId);
          providerName = provider?.providerName ?? '';
        }
      } catch {
        // ignore — provider name is non-essential
      }

      const memberName = `${order.member.firstName ?? ''} ${
        order.member.lastName ?? ''
      }`.trim();
      const emailId = order.member.emailId ?? '';
      const phoneNumber = order.member.contactNumber ?? '';
      const orderNumber = `ORD-${String(payload.orderId).padStart(6, '0')}`;

      const templateVars: Record<string, string> = {
        memberName,
        orderNumber,
        awbNumber: payload.awbNumber ?? payload.trackingNumber ?? '',
        trackingUrl: payload.trackingUrl ?? '',
        providerName,
        franchiseName: order.franchise?.companyName ?? '',
      };

      const template = await this.emailNotificationService.getNotificationTemplate(templateCode);
      if (!template) {
        this.logger.warn(`Template ${templateCode} not found — skipping notification`);
        return;
      }

      const timestamp = Date.now();
      const idempotencyKey = `ship-${payload.shipmentId}-${payload.newStatus}-${timestamp}`;

      // WhatsApp
      if (template.sendWhatsappNotification && phoneNumber) {
        const waMessage = await this.emailNotificationService.renderWhatsAppFromTemplate(
          template,
          templateVars,
        );
        if (waMessage) {
          await this.notificationService.send({
            type: NotificationType.TRANSACTIONAL,
            channel: NotificationChannel.WHATSAPP,
            recipient: phoneNumber,
            message: waMessage,
            idempotencyKey: `${idempotencyKey}-wa`,
            memberId: order.memberId,
            metadata: {
              event: 'shipment.status.changed',
              shipmentId: payload.shipmentId,
              status: payload.newStatus,
            },
          });
        }
      }

      // Email
      if (template.sendEmailNotification && emailId) {
        await this.emailNotificationService.sendEmailFromTemplate(template, {
          to: emailId,
          data: templateVars,
        });
      }

      this.logger.log(
        `Notification sent: shipment=${payload.shipmentId} status=${payload.newStatus} template=${templateCode}`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to notify for shipment ${payload.shipmentId} (${payload.newStatus}): ${message}`,
      );
    }
  }
}
