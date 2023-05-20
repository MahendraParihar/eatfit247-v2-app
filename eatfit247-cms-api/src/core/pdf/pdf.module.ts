import { Module } from '@nestjs/common';
import { PuppeteerModule } from 'nest-puppeteer';
import { FranchiseModule } from 'src/modules/franchise/franchise.module';
import { PdfService } from './pdf.service';

@Module({
  imports: [PuppeteerModule.forRoot({ pipe: true, isGlobal: true }), FranchiseModule],
  providers: [PdfService],
  exports: [PdfService],
})
export class PdfModule {
}
