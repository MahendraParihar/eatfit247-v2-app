import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { modelRegistry, MstFranchise } from '@server_1/core';
import { FranchiseController } from './controllers';
import { FranchisePaymentGatewayService, FranchiseService, FranchiseTurnoverCron, FranchiseTurnoverService } from './services';
import { MstFranchisePaymentGateway } from './models';
// Register models with the model registry
// Models with @Scopes decorator MUST be registered for scopes to work
modelRegistry.register([MstFranchisePaymentGateway]);

@Module({
  imports: [SequelizeModule.forFeature([MstFranchise, MstFranchisePaymentGateway])],
  controllers: [FranchiseController],
  providers: [FranchiseService, FranchisePaymentGatewayService, FranchiseTurnoverService, FranchiseTurnoverCron],
  exports: [FranchiseService, FranchisePaymentGatewayService, FranchiseTurnoverService, SequelizeModule],
})
export class FranchiseModule {
}
