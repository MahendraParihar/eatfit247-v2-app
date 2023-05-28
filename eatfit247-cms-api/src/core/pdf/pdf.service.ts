import { Inject, Injectable } from '@nestjs/common';
import * as path from 'path';
import { existsSync, mkdirSync, readFileSync } from 'fs';
import * as hbs from 'handlebars';
import * as puppeteer from 'puppeteer';
import { TEMPLATE_FOLDER } from 'src/constants/config-constants';
import { IFileModel } from './file-model.interface';
import { FranchiseService } from 'src/modules/franchise/franchise.service';
import { IFranchise } from 'src/response-interface/franchise.interface';
import { REQUEST } from '@nestjs/core';
import { MediaFolderEnum } from 'src/enums/media-folder-enum';

@Injectable()
export class PdfService {
  isHeaderFooterRegistered = false;
  headerTemplate: string;
  footerTemplate: string;

  constructor(private franchiseService: FranchiseService,
    @Inject(REQUEST) private request) {
  }

  /**
   * Generate PDF
   */
  async generatePDF(
    templateName: string,
    downloadFolderPath: string,
    fileName: string,
    data: any,
  ): Promise<IFileModel> {
    const rPath = `${process.cwd()}/media-files`;
    console.log(rPath);
    const fileNameWithExtension = `${fileName}.pdf`;
    const relativePath = `${downloadFolderPath}/${fileNameWithExtension}`;
    const downloadFullPath = `${rPath}/${MediaFolderEnum.DOWNLOADS}`;
    const physicalFolderPath = `${downloadFullPath}/${downloadFolderPath}`;
    const physicalFilePath = `${downloadFullPath}/${relativePath}`;
    //CREATE DIRECTORY IF NOT EXISTS
    if (!existsSync(physicalFolderPath)) {
      mkdirSync(physicalFolderPath, { recursive: true });
    }
    await this.registerHeaderFooter();
    const html = await this.getData(templateName, data);
    const browser = await puppeteer.launch();
    console.log(this.headerTemplate);
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'domcontentloaded' });
    await page.emulateMediaType('screen');
    const tempFile = await page.pdf({
      path: physicalFilePath,
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: this.headerTemplate,
      footerTemplate: this.footerTemplate,
      margin: {
        top: '100px',
        bottom: '80px',
        right: '20px',
        left: '20px',
      },
    });
    await browser.close();

    return {
      filePath: relativePath,
      fileName: fileNameWithExtension,
      buffer: tempFile.toString('base64'),
    } as IFileModel;
  }

  async getData(templateName: string, data: any) {
    const filePath = path.join(__dirname, '..', '..', `${TEMPLATE_FOLDER}/${templateName}.hbs`);
    const hbsTemplate = readFileSync(filePath, 'utf-8');
    return hbs.compile(hbsTemplate)(data);
  }

  async registerHeaderFooter() {
    if (!this.isHeaderFooterRegistered) {
      this.registerHbsControls();
      const franchise: IFranchise = await this.franchiseService.fetchPrimaryFranchise();
      let filePath = path.join(__dirname, '..', '..', `${TEMPLATE_FOLDER}/header.hbs`);
      const headerHbsTemplate = readFileSync(filePath, 'utf-8');
      this.headerTemplate = hbs.compile(headerHbsTemplate)(franchise);
      filePath = path.join(__dirname, '..', '..', `${TEMPLATE_FOLDER}/footer.hbs`);
      const footerHbsTemplate = readFileSync(filePath, 'utf-8');
      this.footerTemplate = hbs.compile(footerHbsTemplate)(franchise);
      this.isHeaderFooterRegistered = true;
    }
  }

  /**
   * Register Image Tad with Src having escape chars
   */
  registerHbsControls() {
    const baseUrl = this.getBaseUrl();
    hbs.registerHelper('img', function(url, cssClass) {
      url = hbs.escapeExpression(baseUrl) + hbs.escapeExpression(url);
      return new hbs.SafeString(`<img class="'${cssClass}'" src="${url}" alt="''" />`);
    });
  }

  /***
   * Get Base Api Url like https://localhost:3000
   */
  getBaseUrl() {
    return this.request ? `${this.request.protocol}:/${this.request.headers.host}/` : '';
  }
}
