import { AfterViewInit, ChangeDetectorRef, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { StringResources } from '../../../enum/string-resources';
import { InputLength } from '../../../constants/input-length';
import { StatusList } from '../../../constants/status-list';
import { AngularEditorConfig } from '@kolkov/angular-editor';
import { Constants } from '../../../constants/Constants';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpService } from '../../../service/http.service';
import { SnackBarService } from '../../../service/snack-bar.service';
import { NavigationService } from '../../../service/navigation.service';
import { ActivatedRoute } from '@angular/router';
import { MatSelectChange } from '@angular/material/select';
import { ApiUrlEnum } from '../../../enum/api-url-enum';
import { ValidationUtil } from '../../../utilites/validation-util';
import moment from 'moment';
import { IDropdownItem, IResponse, IFaq } from 'shared-lib';

@Component({
  standalone: false,
  selector: 'app-faq-manage',
  templateUrl: './faq-manage.component.html',
  styleUrls: ['./faq-manage.component.scss']
})
export class FaqManageComponent implements OnInit, AfterViewInit, OnDestroy {
  fb: FormBuilder = inject(FormBuilder);
  faqCategoryList: IDropdownItem[] = [];
  lovModelObj: IFaq;
  id: number;
  stringRes = StringResources;
  inputLength = InputLength;
  statusList = StatusList;
  editorConfig: AngularEditorConfig = Constants.editorConfig;
  formGroup: FormGroup = this.fb.group({
    faq: [null, [Validators.required, Validators.minLength(this.inputLength.CHAR_2), Validators.maxLength(this.inputLength.CHAR_500)]],
    answer: [null, [Validators.required]],
    faqCategoryId: [null, [Validators.required]],
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

  onStatusChange(event: MatSelectChange): void {
    if (!event.value) {
      this.formGroup.get('endDate').setValidators([Validators.required]);
      this.formGroup.get('endDate').updateValueAndValidity();
    } else {
      this.formGroup.patchValue({ endDate: null });
      this.formGroup.get('endDate').setValidators([]);
      this.formGroup.get('endDate').updateValueAndValidity();
    }
  }

  bindData(): void {
    if (this.lovModelObj) {
      this.formGroup.patchValue({
        faq: this.lovModelObj.faq,
        answer: this.lovModelObj.answer,
        faqCategoryId: this.lovModelObj.faqCategoryId,
        active: this.lovModelObj.active
      });
    }
  }

  async loadDataById(id: number): Promise<void> {
    const res = await this.httpService.getRequest<IResponse<IFaq>>(ApiUrlEnum.FAQ_MANAGE, id, null, true);
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
    if (this.formGroup.value.startDate) {
      payload['startDate'] = moment(this.formGroup.value.startDate).toDate();
    }
    if (this.formGroup.value.endDate) {
      payload['endDate'] = moment(this.formGroup.value.endDate).toDate();
    }
    if (this.id > 0) {
      await this.httpService.putRequest<IResponse<void>>(ApiUrlEnum.FAQ_MANAGE, this.id, payload, true);
    } else {
      await this.httpService.postRequest<IResponse<void>>(ApiUrlEnum.FAQ_MANAGE, payload, true);
    }
    this.snackBarService.showSuccess('Data updated successfully');
  }

  async loadMetaData(): Promise<void> {
    this.faqCategoryList = [];
    const res = await this.httpService.getRequest<IResponse<IDropdownItem[]>>(ApiUrlEnum.FAQ_MASTER_DATA, null, null, true);
    if (res && res.data) {
      this.faqCategoryList = res.data;
    }
  }
}
