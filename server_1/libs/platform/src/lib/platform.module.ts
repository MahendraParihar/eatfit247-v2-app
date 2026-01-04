import { DynamicModule, Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { HttpModule } from '@nestjs/axios';
// Platform models
import {
  LabelModel,
  LogErrorModel,
  MstAddressType,
  MstCountry,
  MstCurrencyModel,
  MstEmailTemplate,
  MstPaymentMode,
  MstPaymentStatus,
  MstState,
  TxnAddress,
} from './database/models';
import { MstPaymentGateway } from './database/models';
// Platform services
import {
  AddressService,
  AddressTypeService,
  CountryService,
  CurrencyService,
  EmailNotificationService,
  GoogleService,
  LogErrorService,
  PaymentModeService,
  PaymentStatusService,
  RazorpayService,
  StateService,
  StripeService,
  TelrService,
  ZoomService,
} from './services';
import { PaymentGatewayService } from './services';
// Platform modules and controllers
import { LabelModule } from './label';
import { FileUploadController } from './file-upload';

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

