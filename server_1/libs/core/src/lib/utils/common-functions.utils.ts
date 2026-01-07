import { IBaseAdminUser, IMediaUpload } from '@eatfit247-shared-lib';
import moment from 'moment';

export class CommonFunctionsUtil {
  public static removeSpecialChar(tempStr: string, replaceChar: string = '-'): string | null {
    if (!tempStr) {
      return null;
    }
    return tempStr.replace(/[^a-zA-Z0-9]/g, replaceChar).replace(/\s+/g, replaceChar).toLowerCase();
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
}

