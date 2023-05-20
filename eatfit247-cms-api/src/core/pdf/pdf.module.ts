import { Module } from '@nestjs/common';
import { InjectBrowser, PuppeteerModule } from 'nest-puppeteer';
import { FranchiseModule } from 'src/modules/franchise/franchise.module';
import { PdfService } from './pdf.service';
import { Browser } from 'puppeteer';

@Module({
  imports: [PuppeteerModule.forRoot(), FranchiseModule],
  providers: [PdfService],
  exports: [PdfService],
})
export class PdfModule {
  constructor(@InjectBrowser() private readonly browser: Browser) {
    this.create();
  }

  async create() {
    const version = await this.browser.version();
    console.log(version);
    return { version };
  }
}
