import { AfterViewInit, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { StringResources } from '../../../enum/string-resources';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpService } from '../../../service/http.service';
import { SnackBarService } from '../../../service/snack-bar.service';
import { NavigationService } from '../../../service/navigation.service';
import { ApiUrlEnum } from '../../../enum/api-url-enum';
import { ResponseDataModel } from '../../../models/response-data.model';
import { ServerResponseEnum } from '../../../enum/server-response-enum';
import { DropdownItem } from '../../../interfaces/dropdown-item';
import { InputLength } from '../../../constants/input-length';
import { FileTypeEnum } from '../../../enum/file-type-enum';
import { MediaForEnum } from '../../../enum/media-for-enum';
import { StatusList } from '../../../constants/status-list';
import { ActivatedRoute } from '@angular/router';
import { ValidationUtil } from '../../../utilites/validation-util';
import { BlogModel } from '../../../models/blog.model';
import { Constants } from '../../../constants/Constants';
import { AngularEditorConfig } from '@kolkov/angular-editor';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatChipInputEvent } from '@angular/material/chips';

@Component({
  selector: 'app-blog-manage',
  templateUrl: './blog-manage.component.html',
  styleUrls: ['./blog-manage.component.scss'],
})
export class BlogManageComponent implements OnInit, AfterViewInit, OnDestroy {
  blogCategoryList: DropdownItem[] = [];
  blogAuthorList: DropdownItem[] = [];
  lovModelObj: BlogModel;
  id: number;
  stringRes = StringResources;
  inputLength = InputLength;
  fileTypeEnum = FileTypeEnum;
  mediaForEnum = MediaForEnum;
  statusList = StatusList;
  tagsList: string[] = [];
  editorConfig: AngularEditorConfig = Constants.editorConfig;
  addOnBlur = true;
  readonly separatorKeysCodes = [ENTER, COMMA] as const;
  formGroup: FormGroup = this.fb.group({
    title: [null, [Validators.required, Validators.minLength(this.inputLength.CHAR_2), Validators.maxLength(this.inputLength.CHAR_100)]],
    description: [null, [Validators.required]],
    blogCategoryId: [null, [Validators.maxLength(this.inputLength.CHAR_100)]],
    blogAuthorId: [null, [Validators.maxLength(this.inputLength.CHAR_100)]],
    isPublished: [null, [Validators.required]],
    isCommentAllow: [null, [Validators.required]],
    isMailSentToSubscriber: [null, [Validators.required]],
    writtenAt: [null, [Validators.required]],
    tags: [null, [Validators.required]],
    active: [true, [Validators.required]],
  });

  constructor(private httpService: HttpService,
    private snackBarService: SnackBarService,
    private navigationService: NavigationService,
    private activatedRoute: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder) {
    this.id = Number(this.activatedRoute.snapshot.paramMap.get('id'));
  }

  get formControl() {
    return this.formGroup.controls;
  }

  async ngOnInit(): Promise<void> {
    await this.loadMetaData();
    if (this.id) {
      await this.loadDataById(this.id);
    }
  }

  ngAfterViewInit(): void {
  }

  ngOnDestroy(): void {
  }

  onCancel(): void {
    this.navigationService.back();
  }

  bindData(): void {
    if (this.lovModelObj) {
      this.tagsList = this.lovModelObj.tags ? this.lovModelObj.tags.toString().split(',') : [];
      this.formGroup.patchValue({
        title: this.lovModelObj.title,
        description: this.lovModelObj.description,
        blogCategoryId: this.lovModelObj.blogCategoryId,
        blogAuthorId: this.lovModelObj.blogAuthorId,
        writtenAt: this.lovModelObj.writtenAt,
        isPublished: this.lovModelObj.isPublished,
        isCommentAllow: this.lovModelObj.isCommentAllow,
        isMailSentToSubscriber: this.lovModelObj.isMailSentToSubscriber,
        tags: this.tagsList.join(','),
        active: this.lovModelObj.active,
      });
    }
  }

  add(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    // Add our data
    if (value) {
      const index = this.tagsList.indexOf(value);
      if (index >= 0) {
        // Clear the input value
        event.chipInput!.clear();
        return;
      }
      this.tagsList.push(value);
    }
    // Clear the input value
    event.chipInput!.clear();
    this.formGroup.patchValue({ tags: this.tagsList.join(',') });
  }

  remove(tag: string): void {
    const index = this.tagsList.indexOf(tag);
    if (index >= 0) {
      this.tagsList.splice(index, 1);
    }
    this.formGroup.patchValue({ tags: this.tagsList.join(',') });
  }

  async loadDataById(id: number): Promise<void> {
    const res: ResponseDataModel = await this.httpService.getRequest(ApiUrlEnum.BLOG_MANAGE, id, null, true);
    if (res) {
      switch (res.code) {
        case ServerResponseEnum.SUCCESS:
          this.lovModelObj = BlogModel.fromJson(res.data);
          this.bindData();
          this.cdr.detectChanges();
          break;
        case ServerResponseEnum.WARNING:
          this.snackBarService.showWarning(res.message);
          break;
        case ServerResponseEnum.ERROR:
          this.snackBarService.showError(res.message);
          break;
      }
    }
  }

  async onSubmit(): Promise<void> {
    ValidationUtil.validateAllFormFields(this.formGroup);
    if (!this.formGroup.valid) {
      return;
    }
    let payload: any = this.formGroup.value;
    let res: ResponseDataModel;
    if (this.id > 0) {
      res = await this.httpService.putRequest(ApiUrlEnum.BLOG_MANAGE, this.id, payload, true);
    } else {
      res = await this.httpService.postRequest(ApiUrlEnum.BLOG_MANAGE, payload, true);
    }
    if (res) {
      switch (res.code) {
        case ServerResponseEnum.SUCCESS:
          this.snackBarService.showSuccess(res.message);
          this.navigationService.back();
          break;
        case ServerResponseEnum.WARNING:
          this.snackBarService.showWarning(res.message);
          break;
        case ServerResponseEnum.ERROR:
          this.snackBarService.showError(res.message);
          break;
      }
    }
  }

  async loadMetaData(): Promise<void> {
    this.blogCategoryList = [];
    this.blogAuthorList = [];
    const res: ResponseDataModel = await this.httpService.getRequest(ApiUrlEnum.BLOG_MASTER_DATA, null, null, true);
    if (res) {
      switch (res.code) {
        case ServerResponseEnum.SUCCESS:
          for (const s of res.data.blogCategory) {
            this.blogCategoryList.push(DropdownItem.fromJson(s));
          }
          for (const s of res.data.blogAuthor) {
            this.blogAuthorList.push(DropdownItem.fromJson(s));
          }
          break;
        case ServerResponseEnum.WARNING:
          this.snackBarService.showWarning(res.message);
          break;
        case ServerResponseEnum.ERROR:
          this.snackBarService.showError(res.message);
          break;
      }
    }
  }
}
