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
    this.create().catch(err => {
      console.log('Browser initialization failed, will use puppeteer.launch() directly:', err.message);
    });
  }

  async create() {
    try {
      const version = await this.browser.version();
      console.log('Puppeteer browser initialized, version:', version);
      return { version };
    } catch (error) {
      console.log('Browser version check failed:', error.message);
      return { version: 'unknown' };
    }
  }
}
