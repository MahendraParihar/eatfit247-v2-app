import { DynamicModule, Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { HttpModule } from '@nestjs/axios';

// Platform models
import {
  LabelModel,
  LogErrorModel,
  MstEmailTemplate,
  MstCountry,
  MstState,
  MstAddressType,
  TxnAddress,
  MstCurrencyModel,
  MstPaymentMode,
  MstPaymentStatus,
} from './database/models';
import { MstPaymentGateway } from './database/models/mst-payment-gateway.model';

// Platform services
import {
  LogErrorService,
  GoogleService,
  ZoomService,
  RazorpayService,
  StripeService,
  TelrService,
  EmailNotificationService,
  CurrencyService,
  StateService,
  CountryService,
  AddressService,
  AddressTypeService,
  PaymentModeService,
  PaymentStatusService,
} from './services';
import { PaymentGatewayService } from './services/payment-gateway.service';

// Platform modules and controllers
import { LabelModule } from './label/label.module';
import { FileUploadController } from './file-upload/file-upload.controller';

@Module({})
export class PlatformModule {
  static forRoot(): DynamicModule {
    const platformModels = [
      LabelModel,
      LogErrorModel,
      MstEmailTemplate,
      MstCountry,
      MstState,
      MstAddressType,
      TxnAddress,
      MstCurrencyModel,
      MstPaymentMode,
      MstPaymentStatus,
      MstPaymentGateway,
    ];

    return {
      module: PlatformModule,
      global: true,
      controllers: [FileUploadController],
      imports: [
        SequelizeModule.forFeature(platformModels),
        LabelModule.asyncRegister(['admin']),
        HttpModule,
      ],
      providers: [
        LogErrorService,
        GoogleService,
        ZoomService,
        RazorpayService,
        StripeService,
        TelrService,
        EmailNotificationService,
        CurrencyService,
        StateService,
        CountryService,
        AddressService,
        AddressTypeService,
        PaymentModeService,
        PaymentStatusService,
        PaymentGatewayService,
      ],
      exports: [
        SequelizeModule,
        LabelModule,
        LogErrorService,
        GoogleService,
        ZoomService,
        RazorpayService,
        StripeService,
        TelrService,
        EmailNotificationService,
        CurrencyService,
        StateService,
        CountryService,
        AddressService,
        AddressTypeService,
        PaymentModeService,
        PaymentStatusService,
        PaymentGatewayService,
      ],
    };
  }

  /**
   * Get all platform models for Sequelize initialization
   * This is used by CommonModule to register models in Sequelize.forRoot()
   */
  static getModels() {
    return [
      LabelModel,
      LogErrorModel,
      MstEmailTemplate,
      MstCountry,
      MstState,
      MstAddressType,
      TxnAddress,
      MstCurrencyModel,
      MstPaymentMode,
      MstPaymentStatus,
      MstPaymentGateway,
    ];
  }
}

