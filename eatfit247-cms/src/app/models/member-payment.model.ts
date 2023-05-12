import {AdminShortInfoModel} from "./admin-short-info.model";
import {LovModel} from "./lov.model";
import {AddressModel} from "./address.model";

export class PaymentModel {
  taxObj: TaxModel;
  currency: string;
  taxAmount: number;
  orderAmount: number;
  totalAmount: number;
  discountAmount: number;

  static fromJson(data: any): PaymentModel | null {
    if (!data) {
      return null;
    }
    const obj: PaymentModel = new PaymentModel();
    obj.taxObj = TaxModel.fromJson(data.taxObj);
    obj.currency = data.currency;
    obj.taxAmount = Number(data.taxAmount);
    obj.orderAmount = Number(data.orderAmount);
    obj.totalAmount = Number(data.totalAmount);
    obj.discountAmount = Number(data.discountAmount);
    return obj;
  }
}

export class PaymentForModel {
  user: PaymentModel;
  system: PaymentModel;
  taxPercentage: number;

  static fromJson(data: any): PaymentForModel | null {
    if (!data) {
      return null;
    }
    const obj: PaymentForModel = new PaymentForModel();
    obj.user = PaymentModel.fromJson(data.user);
    obj.system = PaymentModel.fromJson(data.system);
    obj.taxPercentage = Number(data.taxPercentage);
    return obj;
  }
}

export class MemberPaymentModel extends LovModel {
  memberId: number;
  memberName: string;
  paymentModeId: number;
  programId: number;
  programPlanId: number;
  paymentMode: string;
  program: string;
  plan: string;
  addressId: number;
  transactionId: string;
  invoiceId: string;
  paymentStatusId: number;
  paymentStatus: string;
  promoCode: string;
  currency: string;
  isTaxApplicable: boolean;
  paymentDate: string;
  paymentObj?: PaymentForModel;
  taxObject?: object;
  paymentGatewayResponse?: object;
  paymentId: number;
  noOfCycle: number;
  noOfDaysInCycle: number;
  currentCycleNo?: number;
  currentDayNo?: number;
  deletable: boolean;
  address?: AddressModel;

  static override fromJson(data: any): MemberPaymentModel | null {
    if (!data) {
      return null;
    }
    const authUserObj: MemberPaymentModel = new MemberPaymentModel();
    authUserObj.id = data.id;
    authUserObj.memberId = data.memberId;
    authUserObj.memberName = data.memberName;
    authUserObj.programId = data.programId;
    authUserObj.programPlanId = data.programPlanId;
    authUserObj.program = data.program;
    authUserObj.plan = data.plan;
    authUserObj.paymentModeId = data.paymentModeId;
    authUserObj.paymentMode = data.paymentMode;
    authUserObj.addressId = data.addressId;
    authUserObj.transactionId = data.transactionId;
    authUserObj.invoiceId = data.invoiceId;
    authUserObj.paymentStatusId = data.paymentStatusId;
    authUserObj.paymentStatus = data.paymentStatus;
    authUserObj.promoCode = data.promoCode;
    authUserObj.currency = data.currency;
    authUserObj.isTaxApplicable = data.isTaxApplicable;
    authUserObj.paymentDate = data.date;
    authUserObj.paymentObj = PaymentForModel.fromJson(data.paymentObj);
    authUserObj.taxObject = data.taxObject;
    authUserObj.paymentGatewayResponse = data.paymentGatewayResponse;
    authUserObj.paymentId = data.paymentId;
    authUserObj.noOfCycle = data.noOfCycle;
    authUserObj.noOfDaysInCycle = data.noOfDaysInCycle;
    authUserObj.currentCycleNo = data.currentCycleNo ? data.currentCycleNo : null;
    authUserObj.currentDayNo = data.currentDayNo ? data.currentDayNo : null;
    authUserObj.deletable = data.deletable;
    authUserObj.address = data.address ? AddressModel.fromJson(data.address) : null;
    authUserObj.active = data.active;
    authUserObj.createdBy = AdminShortInfoModel.fromJson(data.createdBy);
    authUserObj.updatedBy = AdminShortInfoModel.fromJson(data.updatedBy);
    authUserObj.createdAt = data.createdAt;
    authUserObj.updatedAt = data.updatedAt;
    return authUserObj;
  }
}

export class TaxModel {
  CGST: BaseTaxModel;
  SGST: BaseTaxModel;
  IGST: BaseTaxModel;

  static fromJson(data: any): TaxModel | null {
    if (!data) {
      return null;
    }
    const obj: TaxModel = new TaxModel();
    obj.CGST = BaseTaxModel.fromJson(data.CGST);
    obj.SGST = BaseTaxModel.fromJson(data.SGST);
    obj.IGST = BaseTaxModel.fromJson(data.IGST);
    return obj;
  }

}

export class BaseTaxModel {
  amount: number;
  percentage: number;

  static fromJson(data: any): BaseTaxModel | null {
    if (!data) {
      return null;
    }
    const obj: BaseTaxModel = new BaseTaxModel();
    obj.amount = data.amount;
    obj.percentage = data.percentage;
    return obj;
  }
}
