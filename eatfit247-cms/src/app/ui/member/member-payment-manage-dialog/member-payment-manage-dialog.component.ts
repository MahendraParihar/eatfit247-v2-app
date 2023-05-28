import { Component, Inject, OnInit } from '@angular/core';
import { StringResources } from '../../../enum/string-resources';
import { InputLength } from '../../../constants/input-length';
import { DropdownItem } from '../../../interfaces/dropdown-item';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { HttpService } from '../../../service/http.service';
import { SnackBarService } from '../../../service/snack-bar.service';
import * as moment from 'moment';
import { find, round } from 'lodash';
import { Constants } from '../../../constants/Constants';
import { ValidationUtil } from '../../../utilites/validation-util';
import { ResponseDataModel } from '../../../models/response-data.model';
import { ApiUrlEnum } from '../../../enum/api-url-enum';
import { ServerResponseEnum } from '../../../enum/server-response-enum';
import { MemberPaymentModel } from '../../../models/member-payment.model';
import { PlanFees } from '../../../models/plan.model';
import { CurrencyConfigList } from '../../../models/currency-config.model';
import { AddressModel } from '../../../models/address.model';

@Component({
  selector: 'app-member-payment-manage-dialog',
  templateUrl: './member-payment-manage-dialog.component.html',
  styleUrls: ['./member-payment-manage-dialog.component.scss'],
})
export class MemberPaymentManageDialogComponent implements OnInit {
  memberId: number;
  id: number;
  stringRes = StringResources;
  inputLength = InputLength;
  dialogData: any;
  paymentModeList: DropdownItem[];
  paymentStatusList: DropdownItem[];
  programList: DropdownItem[];
  planList: PlanFees[];
  currencyConfigList: CurrencyConfigList[];
  addressList: AddressModel[];
  memberPaymentObj: MemberPaymentModel;
  taxPercentage: number;
  taxApplicable: boolean;
  showPaymentNote: boolean = false;
  userCurrencyOrderAmount: number = null;
  userCurrencyDiscountAmount: number = null;
  userCurrencyTaxAmount: number = null;
  userCurrencyTotalAmount: number = null;
  systemCurrencyOrderAmount: number = null;
  systemCurrencyDiscountAmount: number = null;
  systemCurrencyTaxAmount: number = null;
  systemCurrencyTotalAmount: number = null;
  formGroup: FormGroup = this.fb.group({
    programId: [null, [Validators.required]],
    planId: [null, [Validators.required]],
    noOfCycle: [null, [Validators.required, ValidationUtil.numberValidation, Validators.min(1), Validators.maxLength(64)]],
    daysInCycle: [null, [Validators.required, ValidationUtil.numberValidation, Validators.min(1), Validators.maxLength(31)]],
    paymentModeId: [null, [Validators.required]],
    transactionId: [null, []],
    paymentStatusId: [null, [Validators.required]],
    isTaxApplicable: [null, [Validators.required]],
    taxPercentage: [null, [Validators.required]],
    userCurrency: [null, [Validators.required]],
    userOrderAmount: [null, [Validators.required, ValidationUtil.floatValidation, Validators.min(0)]],
    userDiscountAmount: [null, [ValidationUtil.floatValidation, Validators.min(0)]],
    userTaxAmount: [null, [Validators.required, ValidationUtil.floatValidation, Validators.min(0)]],
    userTotalAmount: [null, [Validators.required, ValidationUtil.floatValidation, Validators.min(0)]],
    systemOrderAmount: [null, [Validators.required, ValidationUtil.floatValidation, Validators.min(0)]],
    systemDiscountAmount: [null, [ValidationUtil.floatValidation, Validators.min(0)]],
    systemTaxAmount: [null, [Validators.required, ValidationUtil.floatValidation, Validators.min(0)]],
    systemTotalAmount: [null, [Validators.required, ValidationUtil.floatValidation, Validators.min(0)]],
    systemCurrency: [null, [Validators.required]],
    paymentDate: [null, [Validators.required]],
    active: [true, [Validators.required]],
  });

  constructor(public dialogRef: MatDialogRef<MemberPaymentManageDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder,
    private httpService: HttpService,
    private snackBarService: SnackBarService) {
    this.dialogData = data;
    this.memberId = data.memberId;
    if (!this.dialogData.new) {
      this.id = this.dialogData.memberCallLogId;
    }
  }

  get formControl() {
    return this.formGroup.controls;
  }

  async ngOnInit(): Promise<void> {
    await this.loadMetaData();
    this.intiForm();
    if (this.id) {
      await this.loadDataById(this.id);
    }
  }

  onPositiveClick(): void {
    this.closeDialog(true);
  }

  onNegativeClick(): void {
    this.closeDialog(false);
  }

  closeDialog(flag: boolean) {
    this.dialogRef.close(flag);
  }

  getUserCurrencyFormValues() {
    return this.formGroup.value['userCurrency'];
  }

  getSystemCurrencyFormValues() {
    return this.formGroup.value['systemCurrency'];
  }

  intiForm() {
    this.formGroup.patchValue({
      isTaxApplicable: this.taxApplicable,
      taxPercentage: this.taxApplicable ? this.taxPercentage : 0,
      userCurrency: Constants.DEFAULT_CURRENCY,
      systemCurrency: Constants.DEFAULT_CURRENCY,
    });
  }

  bindData(): void {
    if (this.memberPaymentObj) {
      this.formGroup.patchValue({
        programId: this.memberPaymentObj.programId,
        planId: this.memberPaymentObj.programPlanId,
        noOfCycle: this.memberPaymentObj.noOfCycle,
        daysInCycle: this.memberPaymentObj.noOfDaysInCycle,
        paymentModeId: this.memberPaymentObj.paymentModeId,
        paymentStatusId: this.memberPaymentObj.paymentStatusId,
        paymentId: this.memberPaymentObj.paymentId,
        transactionId: this.memberPaymentObj.transactionId,
        paymentDate: this.memberPaymentObj.paymentDate,
        isTaxApplicable: this.memberPaymentObj.isTaxApplicable,
        taxPercentage: this.memberPaymentObj.paymentObj.taxPercentage,
        userCurrency: this.memberPaymentObj.paymentObj.user.currency,
        userOrderAmount: this.memberPaymentObj.paymentObj.user.orderAmount,
        userDiscountAmount: this.memberPaymentObj.paymentObj.user.discountAmount,
        userTaxAmount: this.memberPaymentObj.paymentObj.user.taxAmount,
        userTotalAmount: this.memberPaymentObj.paymentObj.user.totalAmount,
        systemOrderAmount: this.memberPaymentObj.paymentObj.system.orderAmount,
        systemDiscountAmount: this.memberPaymentObj.paymentObj.system.discountAmount,
        systemTaxAmount: this.memberPaymentObj.paymentObj.user.taxAmount,
        systemTotalAmount: this.memberPaymentObj.paymentObj.system.totalAmount,
        systemCurrency: this.memberPaymentObj.paymentObj.system.currency,
        active: this.memberPaymentObj.active,
      });
    }
  }

  bindPlanFees() {
    if (!this.formGroup.value.planId) {
      this.resetPayment();
      return;
    }
    const planFees = find(this.planList, { id: this.formGroup.value.planId });
    if (planFees) {
      this.calculatePayment(planFees);
    } else {
      this.resetPayment();
    }
  }

  async onSubmit(): Promise<void> {
    ValidationUtil.validateAllFormFields(this.formGroup);
    if (!this.formGroup.valid) {
      return;
    }
    let payload: any = this.formGroup.value;
    if (this.formGroup.value.date) {
      payload['date'] = moment(this.formGroup.value.date).toDate();
    }
    if (this.formGroup.value.startTime) {
      payload['startTime'] = moment(this.formGroup.value.startTime, Constants.DISPLAY_TIME_FORMAT).format(Constants.DEFAULT_TIME_FORMAT);
    }
    if (this.formGroup.value.endTime) {
      payload['endTime'] = moment(this.formGroup.value.endTime, Constants.DISPLAY_TIME_FORMAT).format(Constants.DEFAULT_TIME_FORMAT);
    }
    payload['memberId'] = this.memberId;
    delete payload['systemCurrency'];
    delete payload['userOrderAmount'];
    delete payload['userDiscountAmount'];
    delete payload['userTaxAmount'];
    delete payload['userTotalAmount'];
    delete payload['systemOrderAmount'];
    delete payload['systemTaxAmount'];
    delete payload['systemTotalAmount'];
    delete payload['taxPercentage'];
    let res: ResponseDataModel;
    if (!this.dialogData.new) {
      res = await this.httpService.putRequest(ApiUrlEnum.MEMBER_PAYMENT_MANAGE, this.memberPaymentObj.id, payload, true);
    } else {
      res = await this.httpService.postRequest(ApiUrlEnum.MEMBER_PAYMENT_MANAGE + '/' + this.memberId, payload, true);
    }
    if (res) {
      switch (res.code) {
        case ServerResponseEnum.SUCCESS:
          this.snackBarService.showSuccess(res.message);
          this.onPositiveClick();
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

  private async loadDataById(id: number): Promise<void> {
    const res: ResponseDataModel = await this.httpService.getRequest(ApiUrlEnum.MEMBER_PAYMENT_MANAGE, id, null, true);
    if (res) {
      switch (res.code) {
        case ServerResponseEnum.SUCCESS:
          this.memberPaymentObj = MemberPaymentModel.fromJson(res.data);
          this.bindData();
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

  private async loadMetaData(): Promise<void> {
    this.paymentModeList = [];
    this.programList = [];
    this.planList = [];
    this.currencyConfigList = [];
    this.addressList = [];
    this.paymentStatusList = [];
    const res: ResponseDataModel = await this.httpService.getRequest(ApiUrlEnum.MEMBER_PAYMENT_MASTER_DATA, this.memberId, null, true);
    if (res) {
      switch (res.code) {
        case ServerResponseEnum.SUCCESS:
          for (const s of res.data.paymentMode) {
            this.paymentModeList.push(DropdownItem.fromJson(s));
          }
          for (const s of res.data.program) {
            this.programList.push(DropdownItem.fromJson(s));
          }
          for (const s of res.data.plan) {
            this.planList.push(PlanFees.fromJson(s));
          }
          for (const s of res.data.paymentStatus) {
            this.paymentStatusList.push(DropdownItem.fromJson(s));
          }
          for (const s of res.data.currencyConfig) {
            this.currencyConfigList.push(CurrencyConfigList.fromJson(s));
          }
          if (res.data.addresses && res.data.addresses.length > 0) {
            for (const s of res.data.addresses) {
              this.addressList.push(AddressModel.fromJson(s));
            }
          }
          this.taxPercentage = res.data.taxPercentage;
          this.taxApplicable = res.data.taxApplicable;
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

  private resetPayment(): void {
    this.showPaymentNote = false;
    this.userCurrencyOrderAmount = null;
    this.userCurrencyDiscountAmount = null;
    this.userCurrencyTaxAmount = null;
    this.userCurrencyTotalAmount = null;
    this.systemCurrencyOrderAmount = null;
    this.systemCurrencyDiscountAmount = null;
    this.systemCurrencyTaxAmount = null;
    this.systemCurrencyTotalAmount = null;
    this.formGroup.patchValue({
      noOfCycle: null,
      daysInCycle: null,
      userOrderAmount: null,
      userDiscountAmount: null,
      userTaxAmount: null,
      userTotalAmount: null,
      systemOrderAmount: null,
      systemDiscountAmount: null,
      systemTaxAmount: null,
      systemTotalAmount: null,
    });
  }

  private calculatePayment(planFees: PlanFees) {
    const userCurrency = this.formGroup.value.userCurrency ? this.formGroup.value.userCurrency : Constants.DEFAULT_CURRENCY;
    const taxApplicable = this.formGroup.value.isTaxApplicable;
    const targetCurrencyConfig = find(this.currencyConfigList, { sourceCurrencyCode: userCurrency });
    this.showPaymentNote = targetCurrencyConfig.targetCurrencyCode !== userCurrency;
    this.systemCurrencyOrderAmount = planFees.inrAmount;
    this.systemCurrencyDiscountAmount = this.formGroup.value.systemDiscountAmount ? this.formGroup.value.systemDiscountAmount : 0;
    this.systemCurrencyTaxAmount = taxApplicable ? ((this.systemCurrencyOrderAmount - this.systemCurrencyDiscountAmount) * this.taxPercentage) / 100 : 0;
    this.systemCurrencyTotalAmount = this.systemCurrencyOrderAmount - this.systemCurrencyDiscountAmount + this.systemCurrencyTaxAmount;
    this.userCurrencyOrderAmount = this.convertAmount(this.systemCurrencyOrderAmount, targetCurrencyConfig.conversionRate, targetCurrencyConfig.conversionRateFeesInPercent);
    this.userCurrencyDiscountAmount = this.convertAmount(this.systemCurrencyDiscountAmount, targetCurrencyConfig.conversionRate, targetCurrencyConfig.conversionRateFeesInPercent);
    this.userCurrencyTaxAmount = taxApplicable ? ((this.userCurrencyOrderAmount - this.userCurrencyDiscountAmount) * this.taxPercentage) / 100 : 0;
    this.userCurrencyTotalAmount = this.userCurrencyOrderAmount - this.userCurrencyDiscountAmount + this.userCurrencyTaxAmount;
    this.formGroup.patchValue({
      noOfCycle: planFees.noOfCycle,
      daysInCycle: planFees.noOfDaysInCycle,
      userOrderAmount: this.userCurrencyOrderAmount,
      userDiscountAmount: this.userCurrencyDiscountAmount,
      userTaxAmount: this.userCurrencyTaxAmount,
      userTotalAmount: this.userCurrencyTotalAmount,
      systemOrderAmount: this.systemCurrencyOrderAmount,
      systemDiscountAmount: this.systemCurrencyDiscountAmount,
      systemTaxAmount: this.systemCurrencyTaxAmount,
      systemTotalAmount: this.systemCurrencyTotalAmount,
    });
  }

  private convertAmount(primaryAmount: number, conversionRate: number, conversionFees: number): number {
    return round(primaryAmount / conversionRate);
  }
}
