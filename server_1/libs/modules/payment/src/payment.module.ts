import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { modelRegistry } from '@server_1/core';
import { FranchiseModule } from '@server_1/modules/franchise';
import {
  PaymentGatewayCredentialService,
  PaymentGatewayFactory,
  PaymentGatewayResolverService,
  PaymentService,
} from './services';
import { MstPaymentGatewayCredentials } from './models';
// Register models with the model registry
// Models with @Scopes decorator MUST be registered for scopes to work
modelRegistry.register([MstPaymentGatewayCredentials]);

@Module({
  imports: [
    SequelizeModule.forFeature([MstPaymentGatewayCredentials]),
    FranchiseModule,
  ],
  controllers: [],
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
    PaymentGatewayCredentialService,
  ],
})
export class PaymentModule {
}
