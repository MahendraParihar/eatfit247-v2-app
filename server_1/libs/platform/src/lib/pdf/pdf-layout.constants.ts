/**
 * Shared Puppeteer PDF layout values for templates that use header.hbs / footer.hbs.
 * Invoice PDF uses PdfService.INVOICE_PDF_H_MARGIN only (see pdf.service.ts).
 */

/** Diet plan + recipe: page.pdf left/right margin */
export const PDF_PAGE_MARGIN_H_DIET_RECIPE = '15mm';

/** Header/footer horizontal inset = page margin + .print-sheet horizontal padding (diet-plan.hbs, recipe.hbs) */
export const PDF_HEADER_H_PADDING_DIET_RECIPE = `calc(${PDF_PAGE_MARGIN_H_DIET_RECIPE} + 10px)`;

/**
 * Diet plan only: Puppeteer `margin.top` — reserve just enough for header.hbs (logo + franchise block).
 * Too large a value leaves empty space between the printed header and the body.
 */
export const PDF_MARGIN_TOP_DIET = '90px';
