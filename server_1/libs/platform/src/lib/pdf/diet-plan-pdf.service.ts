import { Injectable } from '@nestjs/common';
import * as path from 'path';
import { existsSync, readFileSync } from 'fs';
import * as hbs from 'handlebars';
import * as puppeteer from 'puppeteer';
import { TEMPLATE_FOLDER } from '@server_1/core';
import { IMemberDietDetail, IDietPlanDetail, IRecipe, IFranchise } from '@eatfit247-shared-lib';

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
    // Prepare template data
    const templateData = {
      memberName: dietPlanData.memberName,
      diet: dietPlanData.diet,
      cycleNo: dietPlanData.cycleNo,
      dayNo: dietPlanData.dayNo,
      type: dietPlanData.type,
      isCycle: dietPlanData.type === 'CYCLE',
      isDay: dietPlanData.type === 'DAY',
      recipes: dietPlanData.recipes || [],
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
}

