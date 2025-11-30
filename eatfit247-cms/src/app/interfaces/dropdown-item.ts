import { IMediaUpload } from 'shared-lib';

export interface UserDropdownItem {
  id: string;
  name: string;
  imagePath?: IMediaUpload[];
  subText: string;
  isSelected: boolean;
  parentId?: number;
}
