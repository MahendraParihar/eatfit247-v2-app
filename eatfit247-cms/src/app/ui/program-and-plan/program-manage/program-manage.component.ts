import { AfterViewInit, ChangeDetectorRef, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { StringResources } from '../../../enum/string-resources';
import { InputLength } from '../../../constants/input-length';
import { IDropdownItem, FileTypeEnum, IProgram, IResponse } from 'shared-lib';
import { MediaForEnum } from '../../../enum/media-for-enum';
import { StatusList } from '../../../constants/status-list';
import { AngularEditorConfig } from '@kolkov/angular-editor';
import { Constants } from '../../../constants/Constants';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpService } from '../../../service/http.service';
import { SnackBarService } from '../../../service/snack-bar.service';
import { NavigationService } from '../../../service/navigation.service';
import { ActivatedRoute } from '@angular/router';
import { MatChipInputEvent } from '@angular/material/chips';
import { ApiUrlEnum } from '../../../enum/api-url-enum';
import { ValidationUtil } from '../../../utilites/validation-util';

@Component({
  standalone: false,
  selector: 'app-program-manage',
  templateUrl: './program-manage.component.html',
  styleUrls: ['./program-manage.component.scss']
})
export class ProgramManageComponent implements OnInit, AfterViewInit, OnDestroy {
  fb: FormBuilder = inject(FormBuilder);
  programCategoryList: IDropdownItem[] = [];
  lovModelObj: IProgram;
  id: number;
  stringRes = StringResources;
  inputLength = InputLength;
  fileTypeEnum = FileTypeEnum;
  mediaForEnum = MediaForEnum;
  statusList = StatusList;
  tagsList: string[] = [];
  idealForList: string[] = [];
  editorConfig: AngularEditorConfig = Constants.editorConfig;
  addOnBlur = true;
  readonly separatorKeysCodes = [ENTER, COMMA] as const;
  formGroup: FormGroup = this.fb.group({
    title: [null, [Validators.required, Validators.minLength(this.inputLength.CHAR_2), Validators.maxLength(this.inputLength.CHAR_100)]],
    details: [null, [Validators.required]],
    punchLine: [null, [Validators.required]],
    programCategoryId: [null, [Validators.maxLength(this.inputLength.CHAR_100)]],
    sequenceNumber: [null, [Validators.required, ValidationUtil.numberValidation]],
    isSpecialProgram: [null, [Validators.required]],
    videoUrl: [null, []],
    idealFor: [null, [Validators.required]],
    tags: [null, [Validators.required]],
    active: [true, [Validators.required]]
  });

  constructor(private httpService: HttpService,
    private snackBarService: SnackBarService,
    private navigationService: NavigationService,
    private activatedRoute: ActivatedRoute,
    private cdr: ChangeDetectorRef) {
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
      this.idealForList = this.lovModelObj.idealFor ? this.lovModelObj.idealFor.toString().split(',') : [];
      this.formGroup.patchValue({
        title: this.lovModelObj.title,
        details: this.lovModelObj.details,
        punchLine: this.lovModelObj.punchLine,
        programCategoryId: this.lovModelObj.programCategoryId,
        sequenceNumber: this.lovModelObj.sequenceNumber,
        isSpecialProgram: this.lovModelObj.isSpecialProgram,
        videoUrl: this.lovModelObj.videoUrl,
        tags: this.tagsList.join(','),
        idealFor: this.idealForList.join(','),
        active: this.lovModelObj.active
      });
    }
  }

  add(event: MatChipInputEvent, type: number): void {
    const value = (event.value || '').trim();
    // Add our data
    if (value) {
      if (type === 1) {
        const index = this.idealForList.indexOf(value);
        if (index >= 0) {
          // Clear the input value
          event.chipInput!.clear();
          return;
        }
        this.idealForList.push(value);
      } else {
        const index = this.tagsList.indexOf(value);
        if (index >= 0) {
          // Clear the input value
          event.chipInput!.clear();
          return;
        }
        this.tagsList.push(value);
      }
    }
    // Clear the input value
    event.chipInput!.clear();
    if (type === 1) {
      this.formGroup.patchValue({ idealFor: this.idealForList.join(',') });
    } else {
      this.formGroup.patchValue({ tags: this.tagsList.join(',') });
    }
  }

  remove(tag: string, type: number): void {
    if (type === 1) {
      const index = this.idealForList.indexOf(tag);
      if (index >= 0) {
        this.idealForList.splice(index, 1);
      }
      this.formGroup.patchValue({ idealFor: this.idealForList.join(',') });
    } else {
      const index = this.tagsList.indexOf(tag);
      if (index >= 0) {
        this.tagsList.splice(index, 1);
      }
      this.formGroup.patchValue({ tags: this.tagsList.join(',') });
    }
  }

  async loadDataById(id: number): Promise<void> {
    const res = await this.httpService.getRequest<IResponse<IProgram>>(ApiUrlEnum.PROGRAM_MANAGE, id, null, true);
    if (res && res.data) {
      this.lovModelObj = res.data;
      this.bindData();
      this.cdr.detectChanges();
    }
  }

  async onSubmit(): Promise<void> {
    ValidationUtil.validateAllFormFields(this.formGroup);
    if (!this.formGroup.valid) {
      return;
    }
    let payload: any = this.formGroup.value;
    if (this.id > 0) {
      await this.httpService.putRequest<IResponse<void>>(ApiUrlEnum.PROGRAM_MANAGE, this.id, payload, true);
    } else {
      await this.httpService.postRequest<IResponse<void>>(ApiUrlEnum.PROGRAM_MANAGE, payload, true);
    }
    this.snackBarService.showSuccess('Data updated successfully');
  }

  async loadMetaData(): Promise<void> {
    this.programCategoryList = [];
    const res = await this.httpService.getRequest<IResponse<{ programPlanType: IDropdownItem[] }>>(ApiUrlEnum.PROGRAM_MASTER_DATA, null, null, true);
    if (res && res.data) {
      this.programCategoryList = res.data.programPlanType;
    }
  }
}
