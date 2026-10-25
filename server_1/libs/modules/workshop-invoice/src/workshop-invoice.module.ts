import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { modelRegistry } from '@server_1/core';
import { TaxEngineModule } from '@server_1/modules/tax-engine';
import { FranchiseModule } from '@server_1/modules/franchise';
import { TxnWorkshopInvoice } from './models';
import { WorkshopInvoiceService } from './services';
import { WorkshopInvoiceController } from './controllers';

// Register models with the model registry before CommonModule.forRoot() initializes Sequelize
modelRegistry.register([TxnWorkshopInvoice]);

@Module({
  imports: [SequelizeModule.forFeature([TxnWorkshopInvoice]), TaxEngineModule, FranchiseModule],
  controllers: [WorkshopInvoiceController],
  providers: [WorkshopInvoiceService],
  exports: [WorkshopInvoiceService],
})
export class WorkshopInvoiceModule {}
