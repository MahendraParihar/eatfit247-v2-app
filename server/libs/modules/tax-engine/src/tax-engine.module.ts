import { Module } from '@nestjs/common';
import { TaxEngineService } from './services/tax-engine.service';
import { IndiaGstService } from './services/india-gst.service';
import { VatService } from './services/vat.service';
import { UsSalesTaxService } from './services/us-sales-tax.service';
import { CommonModule } from '@server/common';

@Module({
  imports: [CommonModule],
  providers: [TaxEngineService, IndiaGstService, VatService, UsSalesTaxService],
  exports: [TaxEngineService, IndiaGstService, VatService, UsSalesTaxService],
})
export class TaxEngineModule {}
