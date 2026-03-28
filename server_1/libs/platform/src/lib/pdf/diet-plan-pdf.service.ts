import { Injectable, Logger } from '@nestjs/common';
import * as path from 'path';
import { existsSync, readFileSync } from 'fs';
import * as hbs from 'handlebars';
import * as puppeteer from 'puppeteer';
import { IFranchise, IMemberDietDetail, IRecipe, TEMPLATE_FOLDER } from '@eatfit247-shared-lib';
import { Env } from '@server_1/core';
import axios from 'axios';
import {
  PDF_HEADER_H_PADDING_DIET_RECIPE,
  PDF_MARGIN_TOP_DIET,
  PDF_PAGE_MARGIN_H_DIET_RECIPE,
} from './pdf-layout.constants';

export interface DietPlanPdfData {
  memberName: string;
  diet: IMemberDietDetail;
  cycleNo: number;
  dayNo?: number;
  type: 'CYCLE' | 'DAY';
  recipes?: IRecipe[];
  franchise?: IFranchise;
  planStartDate?: string;
}

@Injectable()
export class DietPlanPdfService {
  private readonly logger = new Logger(DietPlanPdfService.name);
  /**
   * Generates PDF from Diet Plan data
   *
   * @param dietPlanData - Diet plan data
   * @returns PDF buffer
   */
  async generateDietPlanPdf(dietPlanData: DietPlanPdfData): Promise<Buffer> {
    // Process recipes to convert images to base64
    const processedRecipes = await this.processRecipeImages(dietPlanData.recipes || []);

    // Prepare template data
    const templateData = {
      memberName: dietPlanData.memberName,
      diet: dietPlanData.diet,
      cycleNo: dietPlanData.cycleNo,
      dayNo: dietPlanData.dayNo,
      type: dietPlanData.type,
      isCycle: dietPlanData.type === 'CYCLE',
      isDay: dietPlanData.type === 'DAY',
      recipes: processedRecipes,
      franchise: dietPlanData.franchise,
      planStartDate: dietPlanData.planStartDate,
      generatedDate: new Date(),
      // Format helpers
      formatDate: (dateStr: string | Date) => this.formatDate(dateStr),
      formatMealTime: (category: string) => this.formatMealTime(category),
    };

    // Get HTML from the template
    const html = await this.getTemplateHtml('diet-plan', templateData);

    // Register header and footer (franchise logos embedded as data URLs so Puppeteer header sees them)
    const { headerTemplate, footerTemplate } = await this.getHeaderFooter(dietPlanData.franchise);

    // Generate PDF using Puppeteer
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

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'domcontentloaded' });
      await page.emulateMediaType('screen');
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        displayHeaderFooter: true,
        headerTemplate: headerTemplate,
        footerTemplate: footerTemplate,
        margin: {
          top: PDF_MARGIN_TOP_DIET,
          bottom: '15mm',
          right: PDF_PAGE_MARGIN_H_DIET_RECIPE,
          left: PDF_PAGE_MARGIN_H_DIET_RECIPE,
        },
      });
      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  }

  /**
   * Gets compiled HTML from the Handlebars template
   */
  private async getTemplateHtml(templateName: string, data: any): Promise<string> {
    const templatePath = this.findTemplatePath(`${templateName}.hbs`);
    const hbsTemplate = readFileSync(templatePath, 'utf-8');
    this.registerHandlebarsHelpers();
    return hbs.compile(hbsTemplate)(data);
  }

  /**
   * Find template path
   */
  private findTemplatePath(templateName: string): string {
    const distPath = path.join(process.cwd(), `${TEMPLATE_FOLDER}/${templateName}`);
    const cwdPath = path.join(process.cwd(), `${TEMPLATE_FOLDER}/${templateName}`);
    const relativePath = path.join(
      __dirname,
      '..',
      '..',
      '..',
      '..',
      '..',
      `${TEMPLATE_FOLDER}/${templateName}`,
    );
    if (existsSync(distPath)) {
      return distPath;
    } else if (existsSync(relativePath)) {
      return relativePath;
    } else if (existsSync(cwdPath)) {
      return cwdPath;
    }
    throw new Error(
      `Template not found: ${templateName}. Searched in: ${distPath}, ${cwdPath}, ${relativePath}`,
    );
  }

  /**
   * Get header and footer templates
   */
  private async getHeaderFooter(franchise: any): Promise<{ headerTemplate: string; footerTemplate: string }> {
    // Register Handlebars helpers
    this.registerHandlebarsHelpers();
    const franchiseForHeader = await this.embedFranchiseLogosForPdfHeader(franchise);
    const headerFooterContext = {
      ...(franchiseForHeader ?? {}),
      pdfHorizontalPadding: PDF_HEADER_H_PADDING_DIET_RECIPE,
    };
    // Get header template
    const headerPath = this.findTemplatePath('header.hbs');
    const headerHbsTemplate = readFileSync(headerPath, 'utf-8');
    const headerTemplate = hbs.compile(headerHbsTemplate)(headerFooterContext);
    // Get footer template
    const footerPath = this.findTemplatePath('footer.hbs');
    const footerHbsTemplate = readFileSync(footerPath, 'utf-8');
    const footerTemplate = hbs.compile(footerHbsTemplate)(headerFooterContext);
    return { headerTemplate, footerTemplate };
  }

  /**
   * Resolves franchise logo files (under persistent storage or HTTP) to data URLs so the PDF header template can render them.
   * The previous img helper only looked under process.cwd(), so logos stored in persistentStorageAssetPath were missing.
   */
  private async embedFranchiseLogosForPdfHeader(franchise: IFranchise | undefined | null): Promise<IFranchise | undefined | null> {
    if (!franchise?.logo?.length) {
      return franchise;
    }
    const logos = await Promise.all(
      franchise.logo.map(async (item) => {
        try {
          const dataUrl = await this.convertImageToBase64(item.webUrl, item.mimetype);
          return { ...item, webUrl: dataUrl };
        } catch (error) {
          this.logger.warn(`Failed to embed franchise logo for PDF header: ${item.webUrl}`, { error });
          return item;
        }
      }),
    );
    return { ...franchise, logo: logos };
  }

  /**
   * Registers Handlebars helpers for diet plan template
   */
  private registerHandlebarsHelpers() {
    // Register img helper
    if (!hbs.helpers['img']) {
      hbs.registerHelper('img', (url: string, cssClass: string) => {
        try {
          if (!url) {
            return new hbs.SafeString('');
          }
          if (url.startsWith('data:')) {
            return new hbs.SafeString(
              `<img class="${cssClass}" src="${url}" alt="" style="display:block;max-width:160px;max-height:58px;width:auto;height:auto;object-fit:contain;object-position:left center;" />`,
            );
          }
          let normalizedPath = url.startsWith('/') ? url.substring(1) : url;
          if (normalizedPath.startsWith('media-files/')) {
            normalizedPath = normalizedPath.substring('media-files/'.length);
          }
          const underPersistent = path.join(Env.persistentStorageAssetPath, normalizedPath);
          const cwdRelative = url.startsWith('/') ? url.substring(1) : url;
          const underCwd = path.join(process.cwd(), cwdRelative);
          let fileBuffer: Buffer | null = null;
          let mimeType = 'image/jpeg';
          if (existsSync(underPersistent)) {
            fileBuffer = readFileSync(underPersistent);
            mimeType = this.getMimeTypeFromPath(normalizedPath);
          } else if (existsSync(underCwd)) {
            fileBuffer = readFileSync(underCwd);
            mimeType = this.getMimeTypeFromPath(cwdRelative);
          }
          if (fileBuffer) {
            const dataUrl = `data:${mimeType};base64,${fileBuffer.toString('base64')}`;
            return new hbs.SafeString(
              `<img class="${cssClass}" src="${dataUrl}" alt="" style="display:block;max-width:160px;max-height:58px;width:auto;height:auto;object-fit:contain;object-position:left center;" />`,
            );
          }
        } catch (e) {
          // Ignore errors
        }
        return new hbs.SafeString('');
      });
    }
    // Format date helper
    if (!hbs.helpers['formatDate']) {
      hbs.registerHelper('formatDate', (dateStr: string | Date) => {
        return this.formatDate(dateStr);
      });
    }
    // Format meal time helper
    if (!hbs.helpers['formatMealTime']) {
      hbs.registerHelper('formatMealTime', (category: string) => {
        return this.formatMealTime(category);
      });
    }
    // Greater than helper
    if (!hbs.helpers['gt']) {
      hbs.registerHelper('gt', (a: number, b: number) => {
        return a > b;
      });
    }
    // Equality helper
    if (!hbs.helpers['eq']) {
      hbs.registerHelper('eq', (a: any, b: any) => {
        return a === b;
      });
    }
    // Length helper
    if (!hbs.helpers['length']) {
      hbs.registerHelper('length', (arr: any[]) => {
        return arr ? arr.length : 0;
      });
    }
    // Split directions helper
    if (!hbs.helpers['splitDirections']) {
      hbs.registerHelper('splitDirections', (text: string) => {
        if (!text || text.trim() === '') return [];
        const cleanText = text
          .replace(/<br\s*\/?>/gi, '\n')
          .replace(/<\/p>/gi, '\n')
          .replace(/<p[^>]*>/gi, '')
          .replace(/<li[^>]*>/gi, '')
          .replace(/<\/li>/gi, '\n')
          .replace(/<ol[^>]*>/gi, '')
          .replace(/<\/ol>/gi, '')
          .replace(/<ul[^>]*>/gi, '')
          .replace(/<\/ul>/gi, '')
          .replace(/<[^>]+>/g, '')
          .trim();
        const items = cleanText
          .split(/\n+/)
          .map((item) => item.trim())
          .filter((item) => item.length > 0);
        return items.length > 0 ? items : [text.trim()];
      });
    }
    // Lookup helper (built-in but ensure it's available)
    if (!hbs.helpers['lookup']) {
      hbs.registerHelper('lookup', (obj: any, key: string | number) => {
        return obj && obj[key];
      });
    }
  }

  /**
   * Formats date string
   */
  private formatDate(dateStr: string | Date): string {
    try {
      const date = dateStr instanceof Date ? dateStr : new Date(dateStr);
      return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return String(dateStr);
    }
  }

  /**
   * Formats meal time/category name
   */
  private formatMealTime(category: string): string {
    if (!category) return category;
    // Convert common category names to readable format
    const formatted = category
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());
    return formatted;
  }

  /**
   * Processes recipes to convert image URLs to base64 data URLs
   */
  private async processRecipeImages(recipes: IRecipe[]): Promise<IRecipe[]> {
    if (!recipes || recipes.length === 0) {
      return recipes;
    }

    const processedRecipes = await Promise.all(
      recipes.map(async (recipe) => {
        if (!recipe.imagePath || recipe.imagePath.length === 0) {
          return recipe;
        }

        // Process each image in the imagePath array
        const processedImages = await Promise.all(
          recipe.imagePath.map(async (image) => {
            try {
              const base64DataUrl = await this.convertImageToBase64(image.webUrl, image.mimetype);
              return {
                ...image,
                webUrl: base64DataUrl,
              };
            } catch (error) {
              this.logger.error(`Failed to convert image ${image.webUrl} to base64`, { error });
              // Return original image if conversion fails
              return image;
            }
          }),
        );

        return {
          ...recipe,
          imagePath: processedImages,
        };
      }),
    );

    return processedRecipes;
  }

  /**
   * Converts an image URL to base64 data URL
   * Handles both local file paths and HTTP URLs
   */
  private async convertImageToBase64(imageUrl: string, mimetype?: string): Promise<string> {
    if (!imageUrl) {
      throw new Error('Image URL is required');
    }

    // Check if it's a local file path (starts with media-files/)
    if (imageUrl.startsWith('media-files/')) {
      return this.convertLocalFileToBase64(imageUrl, mimetype);
    }

    // Check if it's an absolute HTTP/HTTPS URL
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return await this.convertHttpUrlToBase64(imageUrl, mimetype);
    }

    // Try as local file path (relative to persistentStorageAssetPath)
    return this.convertLocalFileToBase64(imageUrl, mimetype);
  }

  /**
   * Converts a local file to base64 data URL
   */
  private convertLocalFileToBase64(filePath: string, mimetype?: string): string {
    try {
      // Remove leading slash if present
      let normalizedPath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
      
      // Remove 'media-files/' prefix if present (it's only for HTTP serving, not file system)
      if (normalizedPath.startsWith('media-files/')) {
        normalizedPath = normalizedPath.substring('media-files/'.length);
      }
      
      // Try multiple possible paths
      const persistentStoragePath = Env.persistentStorageAssetPath;
      const fullPath = path.join(persistentStoragePath, normalizedPath);
      
      if (!existsSync(fullPath)) {
        // Try with process.cwd() as fallback
        const cwdPath = path.join(process.cwd(), normalizedPath);
        if (existsSync(cwdPath)) {
          const fileBuffer = readFileSync(cwdPath);
          const mimeType = mimetype || this.getMimeTypeFromPath(normalizedPath);
          return `data:${mimeType};base64,${fileBuffer.toString('base64')}`;
        }
        throw new Error(`File not found: ${fullPath} or ${cwdPath}`);
      }

      const fileBuffer = readFileSync(fullPath);
      const mimeType = mimetype || this.getMimeTypeFromPath(normalizedPath);
      return `data:${mimeType};base64,${fileBuffer.toString('base64')}`;
    } catch (error) {
      this.logger.error(`Error reading local file ${filePath}`, { error });
      throw error;
    }
  }

  /**
   * Converts an HTTP URL to base64 data URL
   */
  private async convertHttpUrlToBase64(url: string, mimetype?: string): Promise<string> {
    try {
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 10000, // 10 second timeout
      });

      const buffer = Buffer.from(response.data);
      const mimeType = mimetype || response.headers['content-type'] || 'image/jpeg';
      return `data:${mimeType};base64,${buffer.toString('base64')}`;
    } catch (error) {
      this.logger.error(`Error fetching image from URL ${url}`, { error });
      throw error;
    }
  }

  /**
   * Gets MIME type from file path extension
   */
  private getMimeTypeFromPath(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
      '.bmp': 'image/bmp',
    };
    return mimeTypes[ext] || 'image/jpeg';
  }
}

