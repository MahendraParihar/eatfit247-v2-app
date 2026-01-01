import { Inject, Injectable } from '@nestjs/common';
import { APP_CONFIG_VALUES } from './app-config.factory';
import { converterFactory, valueToBoolean, valueToNumber, valueToString } from '../config.utils';

@Injectable()
export class AppConfigService {
  constructor(@Inject(APP_CONFIG_VALUES) private readonly configValues: Record<string, string | number | object>) {}

  public get = (key: string) => {
    const value = this.configValues[key];
    return value != null ? String(value) : '';
  };

  public getString = converterFactory(this.get, valueToString);
  public getBoolean = converterFactory(this.get, valueToBoolean);
  public getNumber = converterFactory(this.get, valueToNumber);
}

