import { IMediaUpload } from './media-upload.interface';

export interface DropdownListInterface {
  id: any;
  name: string;
  selected: boolean;
  parentId?: number;
}

export interface MultiTextDropdownListInterface {
  id: number;
  name: string;
  imagePath?: IMediaUpload[];
  subText: string;
  selected: boolean;
  parentId?: number;
}
