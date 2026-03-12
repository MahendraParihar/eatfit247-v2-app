import { IBaseAdminUser, IMediaUpload } from '@eatfit247-shared-lib';
import moment from 'moment';

export class CommonFunctionsUtil {
  public static removeSpecialChar(
    tempStr: string,
    replaceChar: string = '-',
    lowerCase = true,
  ): string | null {
    if (!tempStr) {
      return null;
    }
    return lowerCase
      ? tempStr
          .replace(/[^a-zA-Z0-9]/g, replaceChar)
          .replace(/\s+/g, replaceChar)
          .toLowerCase()
      : tempStr
          .replace(/[^a-zA-Z0-9]/g, replaceChar)
          .replace(/\s+/g, replaceChar)
          .toString();
  }

  public static getAdminShortInfo(obj: any, aliasString: string): IBaseAdminUser | null {
    return <IBaseAdminUser>{
      firstName: obj.firstName,
      lastName: obj.lastName,
    };
  }

  public static generateRandomNumber(numberLength: number): string {
    let text = '';
    const possible = '123456789';
    for (let i = 0; i < numberLength; i++) {
      const sup = Math.floor(Math.random() * possible.length);
      text += i > 0 && sup == i ? '0' : possible.charAt(sup);
    }
    return text;
  }

  public static generateRandomString(length: number): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@$#*()';
    let result = '';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }

  public static getInvoiceNumber(paymentId: number) {
    return `EF24B7${paymentId}${moment().format('YYYYMMDD')}`;
  }

  public static buildImageUrl(images: IMediaUpload[]): IMediaUpload[] {
    if (!images || images.length === 0) {
      return images;
    }
    return images.map((image) => {
      // Create a new object to avoid mutating the original
      const normalizedWebUrl = image.webUrl?.startsWith('/')
        ? image.webUrl.substring(1)
        : image.webUrl;
      return {
        ...image,
        webUrl: `${normalizedWebUrl}`,
      };
    });
  }

  public static toNumber(value: string | number | null | undefined): number {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return value;
    const parsed = parseFloat(String(value));
    return isNaN(parsed) ? 0 : parsed;
  }

  /**
   * Get financial year based on the given date and financial year start month
   * @param date - The date to calculate financial year for
   * @param fyStartMonth - The month when financial year starts (1-12, where 1 = January)
   * @returns The financial year (e.g., 2024 for FY 2024-2025)
   */
  public static getFinancialYear(date: Date, fyStartMonth: number): number {
    const month = date.getMonth() + 1; // getMonth() returns 0-11, so add 1
    const year = date.getFullYear();
    // If current month is before the financial year start month,
    // the financial year started in the previous calendar year
    if (month < fyStartMonth) {
      return year - 1;
    }
    return year;
  }
}
