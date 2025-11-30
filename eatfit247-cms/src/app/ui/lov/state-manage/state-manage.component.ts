import { AfterViewInit, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { StringResources } from '../../../enum/string-resources';
import { InputLength } from '../../../constants/input-length';
import { IDropdownItem, FileTypeEnum, IResponse, IState } from 'shared-lib';
import { MediaForEnum } from '../../../enum/media-for-enum';
import { StatusList } from '../../../constants/status-list';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpService } from '../../../service/http.service';
import { SnackBarService } from '../../../service/snack-bar.service';
import { NavigationService } from '../../../service/navigation.service';
import { ActivatedRoute } from '@angular/router';
import { ApiUrlEnum } from '../../../enum/api-url-enum';
import { ValidationUtil } from '../../../utilites/validation-util';

@Component({
  standalone: false,
  selector: 'app-state-manage',
  templateUrl: './state-manage.component.html',
  styleUrls: ['./state-manage.component.scss']
})
export class StateManageComponent implements OnInit, AfterViewInit, OnDestroy {
  fb: FormBuilder = inject(FormBuilder);
  countryList: IDropdownItem[] = [];
  stateModelObj: IState;
  id: number;
  stringRes = StringResources;
  inputLength = InputLength;
  fileTypeEnum = FileTypeEnum;
  mediaForEnum = MediaForEnum;
  statusList = StatusList;
  formGroup: FormGroup = this.fb.group({
    name: [null, [Validators.required, Validators.maxLength(this.inputLength.CHAR_100)]],
    code: [null, [Validators.required, Validators.maxLength(this.inputLength.CHAR_5)]],
    countryId: [null, [Validators.required, Validators.maxLength(this.inputLength.CHAR_5)]],
    active: [true, [Validators.required]]
  });

  constructor(private httpService: HttpService,
    private snackBarService: SnackBarService,
    private navigationService: NavigationService,
    private activatedRoute: ActivatedRoute) {
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
    if (this.stateModelObj) {
      this.formGroup.patchValue({
        name: this.stateModelObj.name,
        code: this.stateModelObj.code,
        countryId: this.stateModelObj.countryId,
        active: this.stateModelObj.active
      });
    }
  }

  async loadDataById(id: number): Promise<void> {
    const res = await this.httpService.getRequest<IResponse<IState>>(ApiUrlEnum.STATE_MANAGE, id, null, true);
    if (res) {
      this.stateModelObj = res.data;
      this.bindData();
    }
  }

  async onSubmit(): Promise<void> {
    ValidationUtil.validateAllFormFields(this.formGroup);
    if (!this.formGroup.valid) {
      return;
    }
    let payload: any = this.formGroup.value;
    if (this.id > 0) {
      await this.httpService.putRequest(ApiUrlEnum.STATE_MANAGE, this.id, payload, true);
    } else {
      await this.httpService.postRequest(ApiUrlEnum.STATE_MANAGE, payload, true);
    }
    this.snackBarService.showSuccess('Data updated successfully');
  }

  async loadMetaData(): Promise<void> {
    this.countryList = [];
    const res = await this.httpService.getRequest<IResponse<IDropdownItem[]>>(ApiUrlEnum.COUNTRY_LIST_MASTER, null, null, true);
    if (res) {
      this.countryList = res.data;
    }
  }
}
