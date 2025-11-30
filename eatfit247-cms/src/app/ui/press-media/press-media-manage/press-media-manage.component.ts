import { AfterViewInit, ChangeDetectorRef, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { StringResources } from '../../../enum/string-resources';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpService } from '../../../service/http.service';
import { SnackBarService } from '../../../service/snack-bar.service';
import { NavigationService } from '../../../service/navigation.service';
import { ApiUrlEnum } from '../../../enum/api-url-enum';
import { InputLength } from '../../../constants/input-length';
import { FileTypeEnum, IPressMedia, IResponse } from 'shared-lib';
import { MediaForEnum } from '../../../enum/media-for-enum';
import { StatusList } from '../../../constants/status-list';
import { ActivatedRoute } from '@angular/router';
import { ValidationUtil } from '../../../utilites/validation-util';

@Component({
  standalone: false,
  selector: 'app-press-media-manage',
  templateUrl: './press-media-manage.component.html',
  styleUrls: ['./press-media-manage.component.scss']
})
export class PressMediaManageComponent implements OnInit, AfterViewInit, OnDestroy {
  fb: FormBuilder = inject(FormBuilder);
  lovModelObj: IPressMedia;
  id: number;
  stringRes = StringResources;
  inputLength = InputLength;
  fileTypeEnum = FileTypeEnum;
  mediaForEnum = MediaForEnum;
  statusList = StatusList;
  typeOptions = [
    { value: 'youtube', label: 'YouTube' },
    { value: 'press', label: 'Press' }
  ];
  formGroup: FormGroup = this.fb.group({
    title: [null, [Validators.maxLength(this.inputLength.CHAR_200)]],
    type: [null, [Validators.required]],
    link: [null, [Validators.required]],
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
      this.formGroup.patchValue({
        title: this.lovModelObj.title,
        type: this.lovModelObj.type,
        link: this.lovModelObj.link,
        active: this.lovModelObj.active
      });
    }
  }

  async loadDataById(id: number): Promise<void> {
    const res = await this.httpService.getRequest<IResponse<IPressMedia>>(ApiUrlEnum.PRESS_MEDIA_MANAGE, id, null, true);
    if (res) {
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
      await this.httpService.putRequest(ApiUrlEnum.PRESS_MEDIA_MANAGE, this.id, payload, true);
    } else {
      await this.httpService.postRequest(ApiUrlEnum.PRESS_MEDIA_MANAGE, payload, true);
    }
    this.snackBarService.showSuccess('Data updated successfully');
  }
}

