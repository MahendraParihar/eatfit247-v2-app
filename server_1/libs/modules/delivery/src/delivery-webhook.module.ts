import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { modelRegistry } from '@server_1/core';
import { MstState, MstCountry } from '@server_1/platform';
import { TxnMemberProduct, TxnMemberProductOrderItem } from '@server_1/modules/member/models';
import {
  CachePincodeServiceability,
  MstCourierProvider,
  MstWarehouse,
  TxnCourierApiLog,
  TxnCourierProviderAccount,
  TxnCourierProviderWarehouse,
  TxnCourierWebhookLog,
  TxnShipment,
  TxnShipmentItem,
  TxnShipmentRateQuote,
  TxnShipmentTrackingEvent,
} from './models';
import { CourierWebhookController } from './controllers/public/courier-webhook.controller';
import { CourierWebhookService } from './services/courier-webhook.service';
import { ShipmentRecordService } from './services/shipment-record.service';
import {
  NimbusWebhookStrategy,
  ShiprocketWebhookStrategy,
  ShipwayWebhookStrategy,
  WebhookStrategyFactory,
} from './providers/webhook-strategies';
import { ShipmentNotificationListener } from './listeners/shipment-notification.listener';
import { NotificationModule } from '@server_1/modules/notification';

// Public-api uses a slimmer module than the admin DeliveryModule. We still
// register the full delivery model set with modelRegistry — TxnShipment's
// associations reference MstWarehouse / TxnCourierProviderAccount / etc., and
// Sequelize fails to initialize if those models aren't registered globally.
modelRegistry.register([
  CachePincodeServiceability,
  MstCourierProvider,
  MstWarehouse,
  TxnCourierProviderAccount,
  TxnCourierProviderWarehouse,
  TxnShipment,
  TxnShipmentItem,
  TxnShipmentRateQuote,
  TxnShipmentTrackingEvent,
  TxnCourierApiLog,
  TxnCourierWebhookLog,
]);

@Module({
  imports: [
    SequelizeModule.forFeature([
      MstCourierProvider,
      MstWarehouse,
      TxnCourierProviderAccount,
      TxnCourierProviderWarehouse,
      TxnCourierWebhookLog,
      TxnShipment,
      TxnShipmentItem,
      TxnShipmentRateQuote,
      TxnShipmentTrackingEvent,
      TxnMemberProduct,
      TxnMemberProductOrderItem,
      MstState,
      MstCountry,
    ]),
    NotificationModule,
  ],
  controllers: [CourierWebhookController],
  providers: [
    CourierWebhookService,
    ShipmentRecordService,
    NimbusWebhookStrategy,
    ShiprocketWebhookStrategy,
    ShipwayWebhookStrategy,
    WebhookStrategyFactory,
    ShipmentNotificationListener,
  ],
})
export class DeliveryWebhookModule {}
