import { Inject, Injectable } from '@nestjs/common';
import { APP_CONFIG_VALUES } from './app-config.factory';
import { converterFactory, valueToBoolean, valueToNumber, valueToString } from '../utils/config.utils';

@Injectable()
export class AppConfigService {
  constructor(@Inject(APP_CONFIG_VALUES) private readonly configValues) {}

  public get = (key: string) => this.configValues[key];

  public getString = converterFactory(this.get, valueToString);
  public getBoolean = converterFactory(this.get, valueToBoolean);
  public getNumber = converterFactory(this.get, valueToNumber);
}

