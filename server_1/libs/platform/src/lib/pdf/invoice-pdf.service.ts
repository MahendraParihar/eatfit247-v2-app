import { Injectable } from '@nestjs/common';
import * as path from 'path';
import { existsSync, readFileSync } from 'fs';
import * as hbs from 'handlebars';
import * as puppeteer from 'puppeteer';
import {
  IInvoiceDocument,
  IInvoiceItem,
  IInvoiceTaxRow,
  TaxMode,
  TaxTypeEnum,
  TEMPLATE_FOLDER,
} from '@eatfit247-shared-lib';
import * as QRCode from 'qrcode';

@Injectable()
export class InvoicePdfService {
  private currencySymbolCache: Map<string, string> = new Map();

  constructor() {}
  /**
   * Generates PDF from InvoiceDocument
   *
   * @param invoiceDoc - Canonical invoice document (pure data, no logic)
   * @returns PDF buffer
   */
  async generateInvoicePdf(invoiceDoc: IInvoiceDocument): Promise<Buffer> {
    // Generate QR code image if enabled
    let qrCodeImageDataUrl: string | null = null;
    if (invoiceDoc.qrCode?.enabled && invoiceDoc.qrCode.value) {
      try {
        qrCodeImageDataUrl = await QRCode.toDataURL(invoiceDoc.qrCode.value, {
          errorCorrectionLevel: 'M',
          type: 'image/png',
          width: 200,
          margin: 1,
        });
      } catch (error) {
        console.error('Failed to generate QR code:', error);
        // Continue without QR code if generation fails
      }
    }
    // Prepare template data
    const templateData = {
      invoice: invoiceDoc,
      qrCodeImage: qrCodeImageDataUrl,
      // Helper flags for conditional rendering
      showSacColumn: invoiceDoc.items.some((item) => item.sacCode),
      showHsnColumn: invoiceDoc.items.some((item) => item.hsnCode),
      showTaxRows: invoiceDoc.tax.taxMode !== TaxMode.NO_TAX && invoiceDoc.tax.rows.length > 0,
      showQrCode: invoiceDoc.qrCode?.enabled === true && qrCodeImageDataUrl !== null,
      hasTaxSummary: invoiceDoc.items.some((item) => item.taxRows && item.taxRows.length > 0),
      isGstTaxType: invoiceDoc.tax.taxType === TaxTypeEnum.GST,
      gstTaxSummary: this.buildGstTaxSummary(invoiceDoc),
      // Format helpers
      formatCurrency: (amount: number) => this.formatCurrency(amount),
      formatDate: (dateStr: string) => this.formatDate(dateStr),
    };
    // Get HTML from the template
    const html = await this.getTemplateHtml('invoice', templateData);
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
          top: '10mm',
          bottom: '10mm',
          right: '10mm',
          left: '10mm',
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
        `Invoice template not found: ${templateName}.hbs. Searched in: ${distPath}, ${cwdPath}, ${relativePath}`,
      );
    }
    const hbsTemplate = readFileSync(filePath, 'utf-8');
    const template = hbs.compile(hbsTemplate);
    // Register helpers
    this.registerHandlebarsHelpers();
    return template(data);
  }

  /**
   * Registers Handlebars helpers for invoice template
   */
  private registerHandlebarsHelpers() {
    // Format currency helper
    if (!hbs.helpers['formatCurrency']) {
      const self = this;
      hbs.registerHelper('formatCurrency', function (amount: number) {
        // Handlebars pass arguments in order, currency might be undefined
        return self.formatCurrency(amount);
      });
    }
    // Format date helper
    if (!hbs.helpers['formatDate']) {
      hbs.registerHelper('formatDate', (dateStr: string) => {
        return this.formatDate(dateStr);
      });
    }
    // Conditional helper for SAC/HSN column
    if (!hbs.helpers['hasSacOrHsn']) {
      hbs.registerHelper('hasSacOrHsn', (items: IInvoiceItem[]) => {
        return items.some((item) => item.sacCode || item.hsnCode);
      });
    }
    // Get SAC or HSN code helper
    if (!hbs.helpers['getSacOrHsn']) {
      hbs.registerHelper('getSacOrHsn', (item: IInvoiceItem) => {
        return item.sacCode || item.hsnCode || '-';
      });
    }
    // Tax row label helper
    if (!hbs.helpers['taxRowLabel']) {
      hbs.registerHelper('taxRowLabel', (row: IInvoiceTaxRow) => {
        if (row.percentage !== undefined) {
          return `${row.label} @ ${row.percentage}%`;
        }
        return row.label;
      });
    }
    // Increment helper for index (to make it 1-based)
    if (!hbs.helpers['increment']) {
      hbs.registerHelper('increment', (value: number) => {
        return value + 1;
      });
    }
    // Subtract helper
    if (!hbs.helpers['subtract']) {
      hbs.registerHelper('subtract', (a: number, b: number) => {
        return (a || 0) - (b || 0);
      });
    }
    // Equality helper
    if (!hbs.helpers['eq']) {
      hbs.registerHelper('eq', (a: any, b: any) => {
        return a === b;
      });
    }
    // Get tax amount by label helper
    if (!hbs.helpers['getTaxAmountByLabel']) {
      hbs.registerHelper('getTaxAmountByLabel', (taxRows: IInvoiceTaxRow[] | undefined, label: string) => {
        if (!taxRows || !Array.isArray(taxRows)) {
          return null;
        }
        const taxRow = taxRows.find((row) => row.label === label);
        return taxRow ? taxRow.amount : null;
      });
    }
    // Greater than helper
    if (!hbs.helpers['gt']) {
      hbs.registerHelper('gt', (a: number, b: number) => {
        return a > b;
      });
    }
    // Length helper
    if (!hbs.helpers['length']) {
      hbs.registerHelper('length', (arr: any[]) => {
        return arr ? arr.length : 0;
      });
    }
  }

  /**
   * Formats currency amount
   */
  private formatCurrency(amount: number): string {
    // Basic currency formatting - can be enhanced with Intl.NumberFormat
    if (amount === undefined || amount === null || isNaN(amount)) {
      return '-';
    }
    const formatted = Math.abs(amount).toFixed(2);
    return `${formatted}`;
  }

  /**
   * Gets currency symbol from the database cache
   */
  private getCurrencySymbol(currency: string | undefined | null): string {
    if (!currency || typeof currency !== 'string' || currency.trim() === '') {
      return '₹'; // Default to INR symbol if currency is not provided
    }
    const currencyCode = currency.toUpperCase();
    return this.currencySymbolCache.get(currencyCode) || currency;
  }

  /**
   * Formats date string
   */
  private formatDate(dateStr: string): string {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  }

  /**
   * Builds GST tax summary grouped by tax rate
   * Groups items by their GST rate and sums up taxable amounts and tax components
   */
  private buildGstTaxSummary(invoiceDoc: IInvoiceDocument): Array<{
    gstRate: number;
    taxableAmount: number;
    cgst: number;
    sgst: number;
    igst: number;
    totalTax: number;
  }> {
    if (invoiceDoc.tax.taxType !== TaxTypeEnum.GST) {
      return [];
    }

    // Group items by tax percentage
    const rateMap = new Map<number, {
      taxableAmount: number;
      cgst: number;
      sgst: number;
      igst: number;
    }>();

    for (const item of invoiceDoc.items) {
      const taxPercentage = item.taxPercentage || 0;
      const taxableAmount = (item.amount || 0) - (item.discount || 0);
      
      // Get CGST, SGST, and IGST amounts from tax rows
      let cgstAmount = 0;
      let sgstAmount = 0;
      let igstAmount = 0;
      
      if (item.taxRows && Array.isArray(item.taxRows)) {
        for (const taxRow of item.taxRows) {
          if (taxRow.label === 'CGST') {
            cgstAmount = taxRow.amount || 0;
          } else if (taxRow.label === 'SGST') {
            sgstAmount = taxRow.amount || 0;
          } else if (taxRow.label === 'IGST') {
            igstAmount = taxRow.amount || 0;
          }
        }
      }

      // If rate already exists, add to it; otherwise create new entry
      if (rateMap.has(taxPercentage)) {
        const existing = rateMap.get(taxPercentage)!;
        existing.taxableAmount += taxableAmount;
        existing.cgst += cgstAmount;
        existing.sgst += sgstAmount;
        existing.igst += igstAmount;
      } else {
        rateMap.set(taxPercentage, {
          taxableAmount,
          cgst: cgstAmount,
          sgst: sgstAmount,
          igst: igstAmount,
        });
      }
    }

    // Convert map to array and sort by GST rate (descending)
    const summary = Array.from(rateMap.entries())
      .map(([gstRate, data]) => ({
        gstRate,
        taxableAmount: data.taxableAmount,
        cgst: data.cgst,
        sgst: data.sgst,
        igst: data.igst,
        totalTax: data.cgst + data.sgst + data.igst,
      }))
      .sort((a, b) => b.gstRate - a.gstRate);

    return summary;
  }
}
