import { Injectable } from '@nestjs/common';
import * as path from 'path';
import { existsSync, mkdirSync, readFileSync } from 'fs';
import * as hbs from 'handlebars';
import * as puppeteer from 'puppeteer';
import { TEMPLATE_FOLDER } from '@server_1/core';
import { IFileModel } from './file-model.interface';
import { IFranchise, MediaForEnum } from '@eatfit247-shared-lib';
import { Env } from '@server_1/core';

@Injectable()
export class PdfService {
  isHeaderFooterRegistered = false;
  headerTemplate: string;
  footerTemplate: string;

  constructor() {}

  /**
   * Generate PDF
   */
  async generatePDF(
    templateName: string,
    downloadFolderPath: string,
    fileName: string,
    data: any,
  ): Promise<IFileModel> {
    const rPath = `${Env.persistentStorageAssetPath}`;
    const fileNameWithExtension = `${fileName}.pdf`;
    const relativePath = `${downloadFolderPath}/${fileNameWithExtension}`;
    const downloadFullPath = `${rPath}/${MediaForEnum.DOWNLOADS}`;
    const physicalFolderPath = `${downloadFullPath}/${downloadFolderPath}`;
    const physicalFilePath = `${downloadFullPath}/${relativePath}`;
    //CREATE DIRECTORY IF NOT EXISTS
    if (!existsSync(physicalFolderPath)) {
      mkdirSync(physicalFolderPath, { recursive: true });
    }
    data.signImg = 'media-files/brand/SS_Sign.png';
    await this.registerHeaderFooter(data.franchise);
    const html = await this.getData(templateName, data);
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
      ],
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'domcontentloaded' });
    await page.emulateMediaType('screen');
    await page.pdf({
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
    const tempFile = readFileSync(physicalFilePath);
    await browser.close();
    return {
      filePath: relativePath,
      fileName: fileNameWithExtension,
      buffer: tempFile.toString('base64'),
    } as IFileModel;
  }

  async getData(templateName: string, data: any) {
    // Try multiple paths: dist folder, process.cwd(), and relative to __dirname
    const distPath = path.join(process.cwd(), `${TEMPLATE_FOLDER}/${templateName}.hbs`);
    const cwdPath = path.join(process.cwd(), `${TEMPLATE_FOLDER}/${templateName}.hbs`);
    const relativePath = path.join(
      __dirname,
      '..',
      '..',
      '..',
      '..',
      `${TEMPLATE_FOLDER}/${templateName}.hbs`,
    );
    let filePath = cwdPath;
    if (existsSync(distPath)) {
      filePath = distPath;
    } else if (existsSync(relativePath)) {
      filePath = relativePath;
    } else if (!existsSync(filePath)) {
      throw new Error(
        `Template not found: ${templateName}.hbs. Searched in: ${distPath}, ${cwdPath}, ${relativePath}`,
      );
    }
    const hbsTemplate = readFileSync(filePath, 'utf-8');
    return hbs.compile(hbsTemplate)(data);
  }

  async registerHeaderFooter(franchise: IFranchise) {
    if (!this.isHeaderFooterRegistered) {
      this.registerHbsControls();
      // Try multiple paths for the header
      const distHeaderPath = path.join(process.cwd(), `${TEMPLATE_FOLDER}/header.hbs`);
      const cwdHeaderPath = path.join(process.cwd(), `${TEMPLATE_FOLDER}/header.hbs`);
      const relativeHeaderPath = path.join(
        __dirname,
        '..',
        '..',
        '..',
        '..',
        `${TEMPLATE_FOLDER}/header.hbs`,
      );
      let headerPath = cwdHeaderPath;
      if (existsSync(distHeaderPath)) {
        headerPath = distHeaderPath;
      } else if (existsSync(relativeHeaderPath)) {
        headerPath = relativeHeaderPath;
      }
      const headerHbsTemplate = readFileSync(headerPath, 'utf-8');
      this.headerTemplate = hbs.compile(headerHbsTemplate)(franchise);
      // Try multiple paths for footer
      const distFooterPath = path.join(process.cwd(), `${TEMPLATE_FOLDER}/footer.hbs`);
      const cwdFooterPath = path.join(process.cwd(), `${TEMPLATE_FOLDER}/footer.hbs`);
      const relativeFooterPath = path.join(
        __dirname,
        '..',
        '..',
        '..',
        '..',
        `${TEMPLATE_FOLDER}/footer.hbs`,
      );
      let footerPath = cwdFooterPath;
      if (existsSync(distFooterPath)) {
        footerPath = distFooterPath;
      } else if (existsSync(relativeFooterPath)) {
        footerPath = relativeFooterPath;
      }
      const footerHbsTemplate = readFileSync(footerPath, 'utf-8');
      this.footerTemplate = hbs.compile(footerHbsTemplate)(franchise);
      this.isHeaderFooterRegistered = true;
    }
  }

  /**
   * Register Image Tag with Src having escape chars
   */
  registerHbsControls() {
    hbs.registerHelper('img', function (url, cssClass) {
      try {
        url = `data:image/jpeg;base64,${readFileSync(path.join(process.cwd(), url)).toString('base64')}`;
        if (cssClass === 'img-logo') {
          return new hbs.SafeString(
            `<img class="${cssClass}" src="${url}" style="height: 100%;width: 100%;" alt="" />`,
          );
        } else if (cssClass === 'recipe-image') {
          return new hbs.SafeString(
            `<img class="${cssClass}" src="${url}" style="width: 150px;height: 150px;border-radius: 25px;border: 1px solid #d3d3d3;" alt="" />`,
          );
        } else if (cssClass === 'owner-sign') {
          return new hbs.SafeString(
            `<img class="${cssClass}" src="${url}" style="width: 100px;height: 50px;border-radius: 0px;border: 1px solid #d3d3d3;" alt="" />`,
          );
        }
        return new hbs.SafeString(
          `<img class="${cssClass}" src="${url}" style="height: 100%;width: 100%;" alt="" />`,
        );
      } catch (e) {
        return new hbs.SafeString(``);
      }
    });
  }
}

