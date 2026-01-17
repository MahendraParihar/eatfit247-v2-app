import { Injectable } from '@nestjs/common';
import * as path from 'path';
import { existsSync, readFileSync } from 'fs';
import * as hbs from 'handlebars';
import * as puppeteer from 'puppeteer';
import { IInvoiceDocument, IInvoiceItem, IInvoiceTaxRow, TaxMode, TEMPLATE_FOLDER } from '@eatfit247-shared-lib';
import * as QRCode from 'qrcode';

@Injectable()
export class InvoicePdfService {
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
      // Format helpers
      formatCurrency: (amount: number) => this.formatCurrency(amount, invoiceDoc.header.currency),
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
      hbs.registerHelper('formatCurrency', (amount: number, currency: string) => {
        return this.formatCurrency(amount, currency);
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
  }

  /**
   * Formats currency amount
   */
  private formatCurrency(amount: number, currency: string): string {
    // Basic currency formatting - can be enhanced with Intl.NumberFormat
    const formatted = Math.abs(amount).toFixed(2);
    const symbol = this.getCurrencySymbol(currency);
    return `${symbol} ${formatted}`;
  }

  /**
   * Gets currency symbol
   */
  private getCurrencySymbol(currency: string): string {
    const symbols: Record<string, string> = {
      INR: '₹',
      USD: '$',
      AED: 'AED',
      EUR: '€',
      GBP: '£',
    };
    return symbols[currency] || currency;
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
}

