import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { IndiaGstService, TaxEngineService, UsSalesTaxService, VatService } from './services';
import { CommonModule, modelRegistry, MstFranchise } from '@server_1/core';
import { MstFranchiseLut, MstTaxMaster } from './models';
import { TaxMasterService } from './services/tax-master.service';
import { LutService } from './services/lut.service';
import { TaxMasterController } from './controllers/admin/tax-master.controller';
// Register models with the model registry
modelRegistry.register([MstTaxMaster, MstFranchiseLut]);

@Module({
  imports: [CommonModule, SequelizeModule.forFeature([MstTaxMaster, MstFranchiseLut, MstFranchise])],
  controllers: [TaxMasterController],
  providers: [TaxEngineService, IndiaGstService, VatService, UsSalesTaxService, TaxMasterService, LutService],
  exports: [TaxEngineService, IndiaGstService, VatService, UsSalesTaxService, LutService, SequelizeModule],
})
export class TaxEngineModule {
}
