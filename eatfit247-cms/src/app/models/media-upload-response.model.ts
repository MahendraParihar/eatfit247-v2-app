export class MediaUploadResponseModel {
  fieldName: string;
  originalName: string;
  encoding: string;
  mimetype: string;
  fileName: string;
  size: number;
  webUrl: string;

  static fromJson(data: any): MediaUploadResponseModel | null {
    if (!data) {
      return null;
    }
    const authUserObj: MediaUploadResponseModel = new MediaUploadResponseModel();
    authUserObj.fieldName = data.fieldName;
    authUserObj.originalName = data.originalName;
    authUserObj.encoding = data.encoding;
    authUserObj.mimetype = data.mimetype;
    authUserObj.fileName = data.fileName;
    authUserObj.size = data.size;
    authUserObj.webUrl = data.webUrl ? `${data.webUrl}` : null;
    return authUserObj;
  }
}
