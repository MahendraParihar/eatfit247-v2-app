import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { MstFranchise, modelRegistry } from '@server_1/core';
import { FranchiseController, PublicFranchiseController } from './controllers';
import { FranchiseService, FranchisePaymentGatewayService } from './services';
import { MstFranchisePaymentGateway } from './models';

// Register models with the model registry
// Models with @Scopes decorator MUST be registered for scopes to work
modelRegistry.register([MstFranchisePaymentGateway]);

@Module({
  imports: [SequelizeModule.forFeature([MstFranchise, MstFranchisePaymentGateway])],
  controllers: [FranchiseController, PublicFranchiseController],
  providers: [FranchiseService, FranchisePaymentGatewayService],
  exports: [FranchiseService, FranchisePaymentGatewayService, SequelizeModule],
})
export class FranchiseModule {
}
