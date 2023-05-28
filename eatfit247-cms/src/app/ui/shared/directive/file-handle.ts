import { SafeUrl } from '@angular/platform-browser';

export interface FileHandle {
  file?: File,
  url?: SafeUrl,
  progress: number,
  isRequested: boolean,
  fileUpdateStatus: number,
  isPastFile: boolean
  name?: string
  size?: number
}
