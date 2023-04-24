import * as path from 'path';

export class FileHelper {
  static customFileName(req, file, callback) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const fileExtension = path.extname(file.originalname);
    callback(null, uniqueSuffix + fileExtension);
  }
}
