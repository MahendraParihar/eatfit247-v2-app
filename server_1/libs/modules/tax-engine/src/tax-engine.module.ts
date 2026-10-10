import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { IndiaGstService, TaxEngineService, UsSalesTaxService, VatService } from './services';
import { CommonModule, modelRegistry, MstFranchise } from '@server_1/core';
import { MstExchangeRate, MstFranchiseLut, MstTaxMaster } from './models';
import { TaxMasterService } from './services/tax-master.service';
import { LutService } from './services/lut.service';
import { ExchangeRateService } from './services/exchange-rate.service';
import { ExchangeRateController } from './controllers/admin/exchange-rate.controller';
import { TaxMasterController } from './controllers/admin/tax-master.controller';
import { FranchiseLutController } from './controllers/admin/franchise-lut.controller';
// Register models with the model registry
modelRegistry.register([MstTaxMaster, MstFranchiseLut, MstExchangeRate]);

@Module({
  imports: [CommonModule, SequelizeModule.forFeature([MstTaxMaster, MstFranchiseLut, MstExchangeRate, MstFranchise])],
  controllers: [TaxMasterController, FranchiseLutController, ExchangeRateController],
  providers: [TaxEngineService, IndiaGstService, VatService, UsSalesTaxService, TaxMasterService, LutService, ExchangeRateService],
  exports: [TaxEngineService, IndiaGstService, VatService, UsSalesTaxService, LutService, ExchangeRateService, SequelizeModule],
})
export class TaxEngineModule {
}
