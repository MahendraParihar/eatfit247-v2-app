import { IAdminShortInfo } from '../response-interface/admin-user.interface';
import { IMediaUpload } from '../response-interface/media-upload.interface';
import * as moment from 'moment/moment';

export class CommonFunctionsUtil {
  constructor() {}

  public static removeSpecialChar(tempStr: string, replaceChar: string = '_'): string {
    if (!tempStr) {
      return null;
    }
    return tempStr.replace('/ /g', replaceChar);
  }

  public static getAdminShortInfo(obj: any, aliasString: string): IAdminShortInfo | null {
    if (!obj) {
      return null;
    }
    if (obj.adminId || obj.firstName || obj.lastName) {
      return <IAdminShortInfo>{
        adminId: obj.adminId,
        firstName: obj.firstName,
        lastName: obj.lastName,
        imagePath: this.getImagesObj(obj.profilePicture),
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

  // generate random number
  public static generateRandomNumber(numberLength: number): string {
    let text = '';
    const possible = '123456789';
    for (let i = 0; i < numberLength; i++) {
      const sup = Math.floor(Math.random() * possible.length);
      text += i > 0 && sup == i ? '0' : possible.charAt(sup);
    }
    return text;
  }

  public static generateRandomString(length): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@$#*()';
    let result = ' ';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }

  public static getInvoiceNumber(paymentId: number) {
    return `EF24B7${paymentId}${moment().format('YYYYMMDD')}`;
  }
}
