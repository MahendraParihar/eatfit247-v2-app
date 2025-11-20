import { ICreateUpdate } from './lov.interface';

export interface ICurrencyConfig extends ICreateUpdate {
  id: any;
  sourceCurrencyCode: string;
  targetCurrencyCode: string;
  conversionRate: number;
  conversionRateFeesInPercent: number;
}

export interface ICurrencyConfigList {
  sourceCurrencyCode: string;
  targetCurrencyCode: string;
  conversionRate: number;
  conversionRateFeesInPercent: number;
}
