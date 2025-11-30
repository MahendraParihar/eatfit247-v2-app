import { Inject, Injectable } from '@nestjs/common';
import { LABEL_VALUES } from './label.factory';

@Injectable()
export class LabelService {
  constructor(@Inject(LABEL_VALUES) private readonly config) {
  }

  public get = (key: string) => this.config[key];
}

