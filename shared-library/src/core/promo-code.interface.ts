import { IBaseAdminUser, ICommonTable } from "../base.interface";
import { DiscountTypeEnum } from "../enum";

export interface IBasePromoCode {
  code: string;
  discountType: DiscountTypeEnum;
  discountValue: number;
  maxDiscount: number | null;
  minOrderAmount: number | null;
  usageLimit: number | null;
  active: boolean;
  expiresAt: Date | null;
}

export interface IManagePromoCode extends IBasePromoCode {
  promoCodeId?: number;
}

export interface IPromoCode extends IBasePromoCode, ICommonTable {
  promoCodeId: number;
  usedCount: number;
  createdByUser?: IBaseAdminUser;
  updatedByUser?: IBaseAdminUser;
}

export interface IApplyPromoCodeResult {
  valid: boolean;
  discountAmount: number;
  finalAmount: number;
  message?: string;
}

