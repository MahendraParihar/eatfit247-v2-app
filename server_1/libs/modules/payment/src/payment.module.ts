import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { FranchiseModule } from '@server_1/modules/franchise';
import {
  PaymentGatewayCredentialService,
  PaymentGatewayFactory,
  PaymentGatewayResolverService,
  PaymentService,
} from './services';
import { MstPaymentGatewayCredentials } from './models';
import { RazorpayWebhookController } from './controllers/public';

@Module({
  imports: [
    SequelizeModule.forFeature([MstPaymentGatewayCredentials]),
    FranchiseModule,
  ],
  controllers: [RazorpayWebhookController],
  providers: [
    PaymentGatewayCredentialService,
    PaymentGatewayResolverService,
    PaymentService,
    PaymentGatewayFactory,
  ],
  exports: [
    SequelizeModule,
    PaymentService,
    PaymentGatewayResolverService,
    PaymentGatewayFactory,
  ],
})
export class PaymentModule {
}
