import {BaseModel} from "./base.model";

export class CurrencyConfigModel extends BaseModel {
  sourceCurrencyCode: string;
  targetCurrencyCode: string;
  conversionRate: number;
  conversionRateFeesInPercent: number;

  static override fromJson(data: any): CurrencyConfigModel | null {
    if (!data) {
      return null;
    }
    const authUserObj: CurrencyConfigModel = new CurrencyConfigModel();
    authUserObj.id = data.id;
    authUserObj.sourceCurrencyCode = data.sourceCurrencyCode;
    authUserObj.targetCurrencyCode = data.targetCurrencyCode;
    authUserObj.conversionRate = data.conversionRate;
    authUserObj.conversionRateFeesInPercent = data.conversionRateFeesInPercent;
    authUserObj.active = data.active;
    authUserObj.createdBy = data.createdBy;
    authUserObj.updatedBy = data.updatedBy;
    authUserObj.createdAt = data.createdAt;
    authUserObj.updatedAt = data.updatedAt;
    return authUserObj;
  }
}

export class CurrencyConfigList {
  sourceCurrencyCode: string;
  targetCurrencyCode: string;
  conversionRate: number;
  conversionRateFeesInPercent: number;

  static fromJson(data: any): CurrencyConfigList | null {
    const authUserObj: CurrencyConfigList = new CurrencyConfigList();
    authUserObj.sourceCurrencyCode = data.sourceCurrencyCode;
    authUserObj.targetCurrencyCode = data.targetCurrencyCode;
    authUserObj.conversionRate = data.conversionRate;
    authUserObj.conversionRateFeesInPercent = data.conversionRateFeesInPercent;
    return authUserObj;
  }
}
