import { DynamicModule, Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

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

// Platform services
import {
  LogErrorService,
  GoogleService,
  ZoomService,
  RazorpayService,
  EmailNotificationService,
  CurrencyService,
  StateService,
  CountryService,
  AddressService,
  AddressTypeService,
  PaymentModeService,
  PaymentStatusService,
} from './services';

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
    ];

    return {
      module: PlatformModule,
      global: true,
      controllers: [FileUploadController],
      imports: [
        SequelizeModule.forFeature(platformModels),
        LabelModule.asyncRegister(['admin']),
      ],
      providers: [
        LogErrorService,
        GoogleService,
        ZoomService,
        RazorpayService,
        EmailNotificationService,
        CurrencyService,
        StateService,
        CountryService,
        AddressService,
        AddressTypeService,
        PaymentModeService,
        PaymentStatusService,
      ],
      exports: [
        SequelizeModule,
        LabelModule,
        LogErrorService,
        GoogleService,
        ZoomService,
        RazorpayService,
        EmailNotificationService,
        CurrencyService,
        StateService,
        CountryService,
        AddressService,
        AddressTypeService,
        PaymentModeService,
        PaymentStatusService,
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
    ];
  }
}

