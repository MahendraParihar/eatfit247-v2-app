import { Pipe, PipeTransform } from '@angular/core';

/**
 * Formats currency values with proper locale formatting
 * @example
 * {{ 1234.56 | formatCurrency:'INR' }}
 * Output: "INR 1,234.56"
 *
 * {{ 1000 | formatCurrency }}
 * Output: "INR 1,000.00"
 */
@Pipe({
  name: 'formatCurrency',
  standalone: true,
})
export class FormatCurrencyPipe implements PipeTransform {
  transform(
    amount: number | undefined | null,
    currencyCode: string = 'INR',
    locale: string = 'en-IN'
  ): string {
    if (amount === null || amount === undefined) {
      return `${currencyCode} 0.00`;
    }

    const formattedAmount = Number(amount).toLocaleString(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    return `${currencyCode} ${formattedAmount}`;
  }
}

