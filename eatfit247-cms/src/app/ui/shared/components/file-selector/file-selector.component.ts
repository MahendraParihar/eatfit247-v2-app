import { Component, Input, IterableDiffers, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { StringResources } from '../../../../enum/string-resources';
import {
  FormArray,
  FormGroup,
  UntypedFormArray,
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import { FileHandle } from '../../directive/file-handle';
import { DomSanitizer } from '@angular/platform-browser';
import { FileTypeEnum } from '../../../../enum/file-type-enum';
import { MediaForEnum } from '../../../../enum/media-for-enum';
import { HttpService } from '../../../../service/http.service';
import { HttpEventType, HttpResponse, HttpStatusCode } from '@angular/common/http';
import { ServerResponseEnum } from '../../../../enum/server-response-enum';
import { MediaUploadResponseModel } from '../../../../models/media-upload-response.model';
import { AlertDialogDataInterface } from '../../../../interfaces/alert-dialog-data.interface';
import { MatDialog } from '@angular/material/dialog';
import { InfoDialogComponent } from '../info-dialog/info-dialog.component';
import { AlertTypeEnum } from '../../../../enum/alert-type-enum';
import { ApiUrlEnum } from '../../../../enum/api-url-enum';

@Component({
  selector: 'app-file-selector',
  templateUrl: './file-selector.component.html',
  styleUrls: ['./file-selector.component.scss'],
})
export class FileSelectorComponent implements OnInit, OnChanges {
  apiUrlEnum = ApiUrlEnum;
  @Input()
  formGroup: UntypedFormGroup;
  @Input()
  isMultiFile: boolean = false;
  @Input()
  mediaFor: MediaForEnum;
  @Input()
  mediaType: FileTypeEnum = FileTypeEnum.IMAGE;
  @Input()
  isRequired: boolean = true;
  @Input()
  uploadedMediaList: MediaUploadResponseModel[] = [];
  @Input()
  controlName: string;
  stringRes = StringResources;
  fileUploadForm: UntypedFormArray = this.fb.array([]);
  selectedFiles: any;
  mediaTypeEnum = FileTypeEnum;
  uploadedFiles: FileHandle[] = [];
  mediaPath = ApiUrlEnum.MEDIA_PATH;
  private differ: IterableDiffers;

  constructor(private fb: UntypedFormBuilder,
    private sanitizer: DomSanitizer,
    private httpService: HttpService,
    private differs: IterableDiffers,
    public dialog: MatDialog) {
    this.differ = this.differs;
  }

  ngOnInit(): void {
    this.formGroup.addControl(this.controlName, this.fileUploadForm);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.uploadedMediaList && this.uploadedMediaList.length > 0) {
      for (const s of this.uploadedMediaList) {
        this.addFile(s);
        this.uploadedFiles.push(<FileHandle>{
          file: null,
          url: s.webUrl,
          name: s.originalName,
          size: s.size,
          progress: 100,
          fileUpdateStatus: 1,
          isRequested: true,
          isPastFile: true,
        });
      }
    }
    console.log(this.uploadedFiles);
  }

  fileArray(): FormArray {
    return this.formGroup.get(this.controlName) as FormArray;
  }

  newFile(f: MediaUploadResponseModel): FormGroup {
    return this.fb.group({
      fieldName: [f.fieldName, [Validators.required]],
      originalName: [f.originalName, [Validators.required]],
      encoding: [f.encoding, [Validators.required]],
      mimetype: [f.mimetype, [Validators.required]],
      fileName: [f.fileName, [Validators.required]],
      webUrl: [f.webUrl, [Validators.required]],
      size: [f.size, [Validators.required]],
    });
  }

  addFile(f: MediaUploadResponseModel) {
    this.fileArray().push(this.newFile(f));
  }

  removeFile(i: number) {
    this.fileArray().removeAt(i);
  }

  selectFile(event: any): void {
    const files: FileHandle[] = [];
    for (const f of event.target.files) {
      const file = f;
      const url = this.sanitizer.bypassSecurityTrustUrl(window.URL.createObjectURL(file));
      files.push(<FileHandle>{
        file: file,
        url: url,
        progress: 0,
        isRequested: false,
        isPastFile: false,
      });
    }
    this.validateNAddFiles(files);
  }

  filesDropped(files: FileHandle[]): void {
    this.validateNAddFiles(files);
  }

  removeItem(index: number): void {
    this.uploadedFiles.splice(index, 1);
    this.removeFile(index);
  }

  getFileSize(size: number): string {
    if (size >= 1024) {
      size = size / 1024;
      if (size >= 1024) {
        size = size / 1024;
        if (size >= 1024) {
          return `${size.toFixed(2)} gb`;
        } else {
          return `${size.toFixed(2)} mb`;
        }
      } else {
        return `${size.toFixed(2)} kb`;
      }
    } else {
      return `${size} byte`;
    }
  }

  validateNAddFiles(files: FileHandle[]): void {
    if (!this.uploadedFiles) {
      this.uploadedFiles = [];
    }
    if (this.uploadedFiles.length === 1 && !this.isMultiFile) {
      this.showAlertDialog();
      return;
    }
    for (const f of files) {
      if (f.file && f.file.type.toString().includes(this.mediaType)) {
        this.uploadedFiles.push(f);
      }
      if (this.uploadedFiles.length === 1 && !this.isMultiFile) {
        break;
      }
    }
    console.log(this.uploadedFiles);
    this.validateNUploadFiles();
  }

  validateNUploadFiles(): void {
    console.log('this.uploadedFiles', this.uploadedFiles);
    for (const f of this.uploadedFiles) {
      if (f.isRequested || f.fileUpdateStatus === 1) {
        continue;
      }
      f.isRequested = true;
      const formData: FormData = new FormData();
      formData.append('file', f.file);
      formData.append('mediaFor', this.mediaFor);
      formData.append('mediaType', this.mediaType);
      console.log('f.file', f.file);
      f.progress = 0;
      this.httpService.uploadMedia(formData).subscribe((event: any) => {
          console.log(event);
          if (event.type === HttpEventType.UploadProgress) {
            f.progress = Math.round(100 * event.loaded / event.total);
          } else if (event instanceof HttpResponse) {
            if (event.status === HttpStatusCode.Created) {
              const res = event.body;
              switch (res.code) {
                case ServerResponseEnum.SUCCESS:
                  f.fileUpdateStatus = 1;
                  const mediaResponse = MediaUploadResponseModel.fromJson(res.data);
                  this.addFile(mediaResponse);
                  break;
                case ServerResponseEnum.WARNING:
                  f.progress = 0;
                  f.fileUpdateStatus = -1;
                  break;
                case ServerResponseEnum.ERROR:
                  f.progress = 0;
                  f.fileUpdateStatus = -1;
                  break;
              }
            } else {
              f.progress = 0;
              f.fileUpdateStatus = -1;
            }
          }
        },
        (err: any) => {
          console.log(err);
          f.progress = 0;
          f.fileUpdateStatus = -1;
        });
    }
  }

  showAlertDialog(): void {
    const dialogData: AlertDialogDataInterface = {
      title: StringResources.ALERT,
      message: StringResources.SINGLE_MEDIA_FILE_ALERT,
      positiveBtnTxt: StringResources.OK,
      negativeBtnTxt: null,
      alertType: AlertTypeEnum.WARNING,
    };
    const dialogRef = this.dialog.open(InfoDialogComponent, {
      width: '350px',
      data: dialogData,
    });
    dialogRef.afterClosed().subscribe(result => {
      return;
    });
  }
}
