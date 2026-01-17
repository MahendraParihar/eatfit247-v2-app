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
  MstPaymentGateway,
  MstPaymentMode,
  MstPaymentStatus,
  MstState,
  TxnAddress,
} from './database/models';
// Platform services
import {
  AddressService,
  AddressTypeService,
  CountryService,
  CurrencyService,
  EmailNotificationService,
  GoogleService,
  LogErrorService,
  PaymentGatewayService,
  PaymentModeService,
  PaymentStatusService,
  RazorpayService,
  StateService,
  StripeService,
  TelrService,
  WooCommerceService,
  ZoomService,
} from './services';
import { DietPlanPdfService, InvoicePdfService, PdfService } from './pdf';
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
      controllers: [FileUploadController],
      global: true,
      imports: [
        SequelizeModule.forFeature(platformModels),
        LabelModule.asyncRegister(['admin']),
        HttpModule,
      ],
      providers: [
        LogErrorService,
        {
          provide: 'GoogleService',
          useClass: GoogleService,
        },
        GoogleService, // Keep original for backward compatibility
        ZoomService,
        RazorpayService,
        StripeService,
        TelrService,
        WooCommerceService,
        EmailNotificationService,
        CurrencyService,
        StateService,
        CountryService,
        AddressService,
        AddressTypeService,
        PaymentModeService,
        PaymentStatusService,
        PaymentGatewayService,
        PdfService,
        InvoicePdfService,
        DietPlanPdfService,
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
        WooCommerceService,
        EmailNotificationService,
        CurrencyService,
        StateService,
        CountryService,
        AddressService,
        AddressTypeService,
        PaymentModeService,
        PaymentStatusService,
        PaymentGatewayService,
        PdfService,
        InvoicePdfService,
        DietPlanPdfService,
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

