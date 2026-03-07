import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ScheduleModule } from '@nestjs/schedule';
import { HttpService, modelRegistry } from '@server_1/core';
import { MstState, MstCountry } from '@server_1/platform';
import { TxnMemberProduct, TxnMemberProductOrderItem } from '@server_1/modules/member/models';
import {
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
} from './models';
import {
  CourierProviderController,
  CourierProviderAccountController,
  WarehouseController,
  CourierProviderWarehouseController,
  ShipmentController,
} from './controllers';
import {
  CourierProviderService,
  CourierProviderAccountService,
  WarehouseService,
  CourierProviderWarehouseService,
  ShipmentRecordService,
  WarehouseResolverService,
  RateSelectorService,
  ShipmentOrchestrationService,
  ShipmentRetryCron,
} from './services';
import { CourierFactory, NimbusAdapter, ShiprocketAdapter } from './providers';

// Register models with the model registry
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
      CachePincodeServiceability,
      MstCourierProvider,
      MstWarehouse,
      TxnCourierProviderAccount,
      TxnCourierProviderWarehouse,
      TxnMemberProduct,
      TxnMemberProductOrderItem,
      MstState,
      MstCountry,
      TxnShipment,
      TxnShipmentItem,
      TxnShipmentRateQuote,
      TxnShipmentTrackingEvent,
      TxnCourierApiLog,
      TxnCourierWebhookLog,
    ]),
    ScheduleModule.forRoot(),
  ],
  controllers: [
    CourierProviderController,
    CourierProviderAccountController,
    WarehouseController,
    CourierProviderWarehouseController,
    ShipmentController,
  ],
  providers: [
    CourierProviderService,
    CourierProviderAccountService,
    WarehouseService,
    CourierProviderWarehouseService,
    ShipmentRecordService,
    WarehouseResolverService,
    RateSelectorService,
    ShipmentOrchestrationService,
    ShipmentRetryCron,
    CourierFactory,
    NimbusAdapter,
    ShiprocketAdapter,
    HttpService,
  ],
  exports: [
    CourierProviderService,
    CourierProviderAccountService,
    WarehouseService,
    CourierProviderWarehouseService,
    ShipmentRecordService,
    ShipmentOrchestrationService,
    CourierFactory,
    SequelizeModule,
  ],
})
export class DeliveryModule {}
