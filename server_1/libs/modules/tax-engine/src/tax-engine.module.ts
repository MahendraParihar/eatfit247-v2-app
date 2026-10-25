import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { IndiaGstService, TaxEngineService, UsSalesTaxService, VatService } from './services';
import { CommonModule, modelRegistry, MstFranchise } from '@server_1/core';
import { MstExchangeRate, MstFranchiseLut, MstFranchiseTaxRegistration, MstTaxMaster } from './models';
import { TaxMasterService } from './services/tax-master.service';
import { LutService } from './services/lut.service';
import { ExchangeRateService } from './services/exchange-rate.service';
import { ExchangeRateController } from './controllers/admin/exchange-rate.controller';
import { TaxMasterController } from './controllers/admin/tax-master.controller';
import { FranchiseLutController } from './controllers/admin/franchise-lut.controller';
import { TaxRegistrationService } from './services/tax-registration.service';
import { TaxRegistrationController } from './controllers/admin/tax-registration.controller';
// Register models with the model registry
modelRegistry.register([MstTaxMaster, MstFranchiseLut, MstExchangeRate, MstFranchiseTaxRegistration]);

@Module({
  imports: [CommonModule, SequelizeModule.forFeature([MstTaxMaster, MstFranchiseLut, MstExchangeRate, MstFranchiseTaxRegistration, MstFranchise])],
  controllers: [TaxMasterController, FranchiseLutController, ExchangeRateController, TaxRegistrationController],
  providers: [TaxEngineService, IndiaGstService, VatService, UsSalesTaxService, TaxMasterService, LutService, ExchangeRateService, TaxRegistrationService],
  exports: [TaxEngineService, IndiaGstService, VatService, UsSalesTaxService, LutService, ExchangeRateService, TaxRegistrationService, SequelizeModule],
})
export class TaxEngineModule {
}
