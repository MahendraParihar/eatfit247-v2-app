import { ChangeDetectorRef, Component, Input, IterableDiffers, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { DomSanitizer } from '@angular/platform-browser';
import { FileTypeEnum, IMediaUpload, MediaForEnum } from '@eatfit247-shared-lib';
import { AlertDialogDataInterface, AlertTypeEnum, FileHandle, HttpService } from '@core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { HttpEventType, HttpResponse } from '@angular/common/http';
import { AlertDialogComponent } from '../alert-dialog/alert-dialog.component';
import { ImageDragDirective } from './directive/image-drag.directive';

@Component({
  selector: 'shared-ui-upload-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatDialogModule,
    ImageDragDirective
  ],
  templateUrl: './upload-form.component.html',
  styleUrl: './upload-form.component.scss'
})
export class UploadFormComponent implements OnInit, OnChanges {
  @Input() formGroup!: FormGroup;
  @Input() isMultiFile = false;
  @Input() mediaFor!: MediaForEnum;
  @Input() mediaType: FileTypeEnum = FileTypeEnum.IMAGE;
  @Input() isRequired = true;
  @Input() uploadedMediaList: IMediaUpload[] = [];
  @Input() controlName!: string;
  @Input() labels!: Map<string, string>;
  fileUploadForm!: FormArray;
  uploadedFiles: FileHandle[] = [];
  mediaTypeEnum = FileTypeEnum;

  constructor(private fb: FormBuilder,
    private sanitizer: DomSanitizer,
    private httpService: HttpService,
    private cdr: ChangeDetectorRef,
    public dialog: MatDialog) {
  }

  ngOnInit(): void {
    this.fileUploadForm = this.fb.array([]);
    this.formGroup.addControl(this.controlName, this.fileUploadForm);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.uploadedMediaList && this.uploadedMediaList.length > 0) {
      for (const s of this.uploadedMediaList) {
        this.addFile(s);
        this.uploadedFiles.push(<FileHandle>{
          url: s.webUrl,
          name: s.originalName,
          size: s.size,
          progress: 100,
          fileUpdateStatus: 1,
          isRequested: true,
          isPastFile: true
        });
      }
    }
  }

  fileArray(): FormArray {
    return this.formGroup.get(this.controlName) as FormArray;
  }

  newFile(f: IMediaUpload): FormGroup {
    return this.fb.group({
      fieldName: [f.fieldName, [Validators.required]],
      originalName: [f.originalName, [Validators.required]],
      encoding: [f.encoding, [Validators.required]],
      mimetype: [f.mimetype, [Validators.required]],
      fileName: [f.fileName, [Validators.required]],
      webUrl: [f.webUrl, [Validators.required]],
      size: [f.size, [Validators.required]]
    });
  }

  addFile(f: IMediaUpload) {
    this.fileArray().push(this.newFile(f));
  }

  removeFile(i: number) {
    this.fileArray().removeAt(i);
    this.cdr.detectChanges();
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
        isPastFile: false
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
    this.cdr.detectChanges();
  }

  getFileSize(size: number | undefined): string {
    if (!size) {
      return '';
    }
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
    this.validateNUploadFiles();
  }

  validateNUploadFiles(): void {
    for (const f of this.uploadedFiles) {
      if (f.isRequested || f.fileUpdateStatus === 1) {
        continue;
      }
      if (f.file) {
        f.isRequested = true;
        const formData: FormData = new FormData();
        formData.append('file', f.file);
        formData.append('mediaFor', this.mediaFor);
        formData.append('mediaType', this.mediaType);
        f.progress = 0;
        f.fileUpdateStatus = 0; // Set to in-progress
        this.httpService.uploadMedia('media/upload-media', formData).subscribe({
          next: (event: any) => {
            if (event.type === HttpEventType.UploadProgress) {
              // Track upload progress
              if (event.total) {
                f.progress = Math.round((100 * event.loaded) / event.total);
              }
            } else if (event instanceof HttpResponse) {
              // Upload complete - 100% success
              if (event.status >= 200 && event.status < 300) {
                f.fileUpdateStatus = 1;
                f.progress = 100;
                const mediaResponse = event.body.data as IMediaUpload;
                this.addFile(mediaResponse);
                this.cdr.detectChanges();
              } else {
                f.progress = 0;
                f.fileUpdateStatus = -1;
                this.cdr.detectChanges();
              }
            }
          },
          error: (error) => {
            f.progress = 0;
            f.fileUpdateStatus = -1;
            this.cdr.detectChanges();
            // TODO Show error
          }
        });
      }
    }
  }

  showAlertDialog(): void {
    const dialogData: AlertDialogDataInterface = {
      title: 'Alert',
      message: 'Only one file can be uploaded at a time. Please remove the existing file and try again.',
      positiveBtnTxt: 'OK',
      negativeBtnTxt: null,
      alertType: AlertTypeEnum.WARNING
    };
    const dialogRef = this.dialog.open(AlertDialogComponent, {
      width: '350px',
      data: dialogData
    });
    dialogRef.afterClosed().subscribe(result => {
      return;
    });
  }
}
