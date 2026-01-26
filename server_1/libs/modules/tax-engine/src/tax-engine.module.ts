import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { IndiaGstService, TaxEngineService, UsSalesTaxService, VatService } from './services';
import { CommonModule, modelRegistry } from '@server_1/core';
import { MstTaxMaster } from './models';
import { TaxMasterService } from './services/tax-master.service';
import { TaxMasterController } from './controllers/admin/tax-master.controller';
// Register models with the model registry
modelRegistry.register([MstTaxMaster]);

@Module({
  imports: [CommonModule, SequelizeModule.forFeature([MstTaxMaster])],
  controllers: [TaxMasterController],
  providers: [TaxEngineService, IndiaGstService, VatService, UsSalesTaxService, TaxMasterService],
  exports: [TaxEngineService, IndiaGstService, VatService, UsSalesTaxService, SequelizeModule],
})
export class TaxEngineModule {
}
