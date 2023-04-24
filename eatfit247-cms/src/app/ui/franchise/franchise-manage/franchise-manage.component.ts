import {AfterViewInit, ChangeDetectorRef, Component, OnDestroy, OnInit} from '@angular/core';
import {StringResources} from "../../../enum/string-resources";
import {InputLength} from "../../../constants/input-length";
import {FileTypeEnum} from "../../../enum/file-type-enum";
import {MediaForEnum} from "../../../enum/media-for-enum";
import {StatusList} from "../../../constants/status-list";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {HttpService} from "../../../service/http.service";
import {SnackBarService} from "../../../service/snack-bar.service";
import {NavigationService} from "../../../service/navigation.service";
import {ActivatedRoute} from "@angular/router";
import {MatSelectChange} from "@angular/material/select";
import {ResponseDataModel} from "../../../models/response-data.model";
import {ApiUrlEnum} from "../../../enum/api-url-enum";
import {ServerResponseEnum} from "../../../enum/server-response-enum";
import {ValidationUtil} from "../../../utilites/validation-util";
import * as moment from "moment/moment";
import {FranchiseModel} from "../../../models/franchise.model";

@Component({
  selector: 'app-franchise-manage',
  templateUrl: './franchise-manage.component.html',
  styleUrls: ['./franchise-manage.component.scss']
})
export class FranchiseManageComponent implements OnInit, AfterViewInit, OnDestroy {

  lovModelObj: FranchiseModel;
  id: number;
  stringRes = StringResources;
  inputLength = InputLength;
  fileTypeEnum = FileTypeEnum;
  mediaForEnum = MediaForEnum;
  statusList = StatusList;

  formGroup: FormGroup = this.fb.group({
    firstName: [null, [Validators.required, Validators.minLength(this.inputLength.CHAR_2), Validators.maxLength(this.inputLength.CHAR_50)]],
    lastName: [null, [Validators.required, Validators.minLength(this.inputLength.CHAR_2), Validators.maxLength(this.inputLength.CHAR_50)]],
    companyName: [null, [Validators.maxLength(this.inputLength.CHAR_100)]],
    contactNumber: [null, [Validators.maxLength(this.inputLength.MAX_CONTACT_NUMBER)]],
    alternateContactNumber: [null, [Validators.maxLength(this.inputLength.MAX_CONTACT_NUMBER)]],
    emailId: [null, [Validators.maxLength(this.inputLength.MAX_EMAIL)]],
    alternateEmailId: [null, [Validators.maxLength(this.inputLength.MAX_EMAIL)]],
    panNumber: [null, [Validators.maxLength(this.inputLength.CHAR_20)]],
    tanNumber: [null, [Validators.maxLength(this.inputLength.CHAR_20)]],
    gstNumber: [null, [Validators.maxLength(this.inputLength.CHAR_20)]],
    startDate: [null, [Validators.required]],
    endDate: [null, []],
    active: [true, [Validators.required]]
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
      this.formGroup.patchValue({endDate: null});
      this.formGroup.get('endDate').setValidators([]);
      this.formGroup.get('endDate').updateValueAndValidity();
    }
  }

  bindData(): void {
    if (this.lovModelObj) {
      this.formGroup.patchValue({
        firstName: this.lovModelObj.firstName,
        lastName: this.lovModelObj.lastName,
        companyName: this.lovModelObj.companyName,
        contactNumber: this.lovModelObj.contactNumber,
        alternateContactNumber: this.lovModelObj.alternateContactNumber,
        emailId: this.lovModelObj.emailId,
        alternateEmailId: this.lovModelObj.alternateEmailId,
        panNumber: this.lovModelObj.panNumber,
        tanNumber: this.lovModelObj.tanNumber,
        gstNumber: this.lovModelObj.gstNumber,
        startDate: this.lovModelObj.startDate,
        endDate: this.lovModelObj.endDate,
        active: this.lovModelObj.active
      });
      this.formGroup.get('endDate').setValidators(this.lovModelObj.active ? [] : [Validators.required]);
      this.formGroup.get('endDate').updateValueAndValidity();
    }
  }

  async loadDataById(id: number): Promise<void> {
    const res: ResponseDataModel = await this.httpService.getRequest(ApiUrlEnum.FRANCHISE_MANAGE, id, null, true);
    if (res) {
      switch (res.code) {
        case ServerResponseEnum.SUCCESS:
          this.lovModelObj = FranchiseModel.fromJson(res.data);
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
    if (this.formGroup.value.startDate) {
      payload['startDate'] = moment(this.formGroup.value.startDate).toDate()
    }
    if (this.formGroup.value.endDate) {
      payload['endDate'] = moment(this.formGroup.value.endDate).toDate()
    }
    let res: ResponseDataModel;
    if (this.id > 0) {
      res = await this.httpService.putRequest(ApiUrlEnum.FRANCHISE_MANAGE, this.id, payload, true);
    } else {
      res = await this.httpService.postRequest(ApiUrlEnum.FRANCHISE_MANAGE, payload, true);
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
}
