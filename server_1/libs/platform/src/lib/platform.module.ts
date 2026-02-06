import { DynamicModule, Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { HttpModule } from '@nestjs/axios';
// Platform models
import {
  LabelModel,
  LogErrorModel,
  MstCountry,
  MstCurrencyModel,
  MstEmailTemplate,
  MstPaymentGateway,
  MstPaymentMode,
  MstPaymentStatus,
  MstState,
  TxnAddress,
  SeoPageModel,
  InvoiceSequenceModel,
} from './database/models';
// Platform services
import {
  AddressService,
  CountryService,
  CurrencyService,
  EmailNotificationService,
  GoogleService,
  InvoiceSequenceService,
  LogErrorService,
  PaymentGatewayService,
  PaymentModeService,
  PaymentStatusService,
  RazorpayService,
  SeoPageService,
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
      TxnAddress,
      MstCurrencyModel,
      MstPaymentMode,
      MstPaymentStatus,
      MstPaymentGateway,
      SeoPageModel,
      InvoiceSequenceModel,
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
        CurrencyService,
        StateService,
        CountryService,
        AddressService,
        PaymentModeService,
        PaymentStatusService,
        PaymentGatewayService,
        PdfService,
        InvoicePdfService,
        DietPlanPdfService,
        EmailNotificationService,
        SeoPageService,
        InvoiceSequenceService,
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
        CurrencyService,
        StateService,
        CountryService,
        AddressService,
        PaymentModeService,
        PaymentStatusService,
        PaymentGatewayService,
        PdfService,
        InvoicePdfService,
        DietPlanPdfService,
        EmailNotificationService,
        SeoPageService,
        InvoiceSequenceService,
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
      TxnAddress,
      MstCurrencyModel,
      MstPaymentMode,
      MstPaymentStatus,
      MstPaymentGateway,
      SeoPageModel,
      InvoiceSequenceModel,
    ];
  }
}

