import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { HttpService, modelRegistry } from '@server_1/core';
import { TxnMemberProduct, TxnMemberProductOrderItem } from '@server_1/modules/member/src/models';
import {
  MstCourierProvider,
  TxnCourierProviderAccount,
  TxnShipment,
  TxnShipmentItem,
  TxnShipmentRateQuote,
  TxnShipmentTrackingEvent,
  TxnCourierApiLog,
  TxnCourierWebhookLog,
} from './models';
import {
  DeliveryController,
  CourierProviderController,
  CourierProviderAccountController,
} from './controllers';
import {
  DeliveryService,
  ShipmentService,
  RateService,
  TrackingService,
  WebhookService,
  FailoverService,
  CourierProviderService,
  CourierProviderAccountService,
} from './services';
import {
  ShipmentRepository,
  RateRepository,
  ApiLogRepository,
  ShipmentItemRepository,
  TrackingRepository,
} from './repositories';
import { CourierFactory, NimbusAdapter, ShiprocketAdapter } from './providers';

// Register models with the model registry
modelRegistry.register([
  MstCourierProvider,
  TxnCourierProviderAccount,
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
      TxnCourierProviderAccount,
      TxnShipment,
      TxnShipmentItem,
      TxnShipmentRateQuote,
      TxnShipmentTrackingEvent,
      TxnCourierApiLog,
      TxnCourierWebhookLog,
      TxnMemberProduct,
      TxnMemberProductOrderItem,
    ]),
  ],
  controllers: [DeliveryController, CourierProviderController, CourierProviderAccountController],
  providers: [
    DeliveryService,
    ShipmentService,
    RateService,
    TrackingService,
    WebhookService,
    FailoverService,
    CourierProviderService,
    CourierProviderAccountService,
    ShipmentRepository,
    RateRepository,
    ApiLogRepository,
    ShipmentItemRepository,
    TrackingRepository,
    CourierFactory,
    NimbusAdapter,
    ShiprocketAdapter,
    HttpService,
  ],
  exports: [
    DeliveryService,
    ShipmentService,
    RateService,
    TrackingService,
    WebhookService,
    FailoverService,
    CourierProviderService,
    CourierProviderAccountService,
    ShipmentRepository,
    RateRepository,
    ApiLogRepository,
    ShipmentItemRepository,
    TrackingRepository,
    CourierFactory,
    SequelizeModule,
  ],
})
export class DeliveryModule {}
