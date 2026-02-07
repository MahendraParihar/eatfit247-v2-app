import { Injectable } from '@nestjs/common';
import * as path from 'path';
import { existsSync, readFileSync } from 'fs';
import * as hbs from 'handlebars';
import * as puppeteer from 'puppeteer';
import { IFranchise, IMemberDietDetail, IRecipe, TEMPLATE_FOLDER } from '@eatfit247-shared-lib';
import { Env } from '@server_1/core';
import axios from 'axios';

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
        margin: {
          top: '20mm',
          bottom: '20mm',
          right: '15mm',
          left: '15mm',
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
    // Try multiple paths for a template
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
        `Diet plan template not found: ${templateName}.hbs. Searched in: ${distPath}, ${cwdPath}, ${relativePath}`,
      );
    }
    const hbsTemplate = readFileSync(filePath, 'utf-8');
    const template = hbs.compile(hbsTemplate);
    // Register helpers
    this.registerHandlebarsHelpers();
    return template(data);
  }

  /**
   * Registers Handlebars helpers for diet plan template
   */
  private registerHandlebarsHelpers() {
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
              console.error(`Failed to convert image ${image.webUrl} to base64:`, error);
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
      console.error(`Error reading local file ${filePath}:`, error);
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
      console.error(`Error fetching image from URL ${url}:`, error);
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

