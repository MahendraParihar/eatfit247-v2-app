import { IMediaUpload, IBaseAdminUser } from 'eatfit247-shared-lib';
import moment from 'moment';

export class CommonFunctionsUtil {
  public static removeSpecialChar(tempStr: string, replaceChar: string = '-'): string {
    if (!tempStr) {
      return null;
    }
    return tempStr.replace(/[^a-zA-Z0-9]/g, replaceChar).replace(/\s+/g, replaceChar).toLowerCase();
  }

  public static getAdminShortInfo(obj: any, aliasString: string): IBaseAdminUser | null {
    if (!obj) {
      return null;
    }
    if (obj.adminId || obj.firstName || obj.lastName) {
      return <IBaseAdminUser>{
        firstName: obj.firstName,
        lastName: obj.lastName,
      };
    } else {
      return null;
    }
  }

  public static getImagesObj(images: any): IMediaUpload[] {
    if (!images || images.length === 0) {
      return null;
    }
    const temp: IMediaUpload[] = [];
    if (images && images.length > 0) {
      for (const i of images) {
        temp.push(<IMediaUpload>{
          fieldName: i.fieldName,
          originalName: i.originalName,
          encoding: i.encoding,
          mimetype: i.mimetype,
          fileName: i.fileName,
          path: i.path,
          size: i.size,
          webUrl: `${i.webUrl}`,
        });
      }
    }
    return temp;
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

  public static buildImageUrl(images: IMediaUpload[], baseUrl: string): IMediaUpload[] {
    if (!images || images.length === 0) {
      return images;
    }
    return images.map((image) => {
      image.webUrl = `${baseUrl}/${image.webUrl}`;
      return image;
    });
  }
}

