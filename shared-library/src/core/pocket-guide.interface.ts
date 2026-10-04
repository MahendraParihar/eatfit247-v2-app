import { IAdminInfo } from '../base.interface';
import { IMediaUpload } from './media-upload.interface';

export interface IBasePocketGuide {
  pocketGuide: string;
  /**
   * The PDF lives in private storage: webUrl is a `private://pocket-guide/<file>` reference,
   * not a URL. It is returned only so the edit form can save it back unchanged.
   * Download through the authenticated download endpoint instead.
   */
  filePath?: IMediaUpload[];
  description?: string;
  imagePath?: IMediaUpload[];
}

export interface IManagePocketGuide extends IBasePocketGuide {
  pocketGuideId?: number;
  active: boolean;
}

export interface IPocketGuide extends IBasePocketGuide, IAdminInfo {
  pocketGuideId: number;
  active: boolean;
  /** True when a PDF is attached (shows the Download action). */
  hasFile: boolean;
  /** Friendly name to save the download as, e.g. "Detox Diet.pdf". */
  downloadFileName?: string;
}

