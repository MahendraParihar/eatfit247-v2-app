import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { HttpModule } from '@nestjs/axios';
import { modelRegistry } from '@server_1/core';
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
import { DeliveryController, CourierProviderController, CourierProviderAccountController } from './controllers';
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
} from './repositories';
import {
  CourierFactory,
  NimbusAdapter,
  ShiprocketAdapter,
  ShipwayAdapter,
} from './providers';

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
    ]),
    HttpModule,
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
    CourierFactory,
    NimbusAdapter,
    ShiprocketAdapter,
    ShipwayAdapter,
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
    CourierFactory,
    SequelizeModule,
  ],
})
export class DeliveryModule {}

