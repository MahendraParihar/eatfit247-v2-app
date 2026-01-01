import { Inject, Injectable } from '@nestjs/common';
import { LABEL_VALUES } from './label.factory';

@Injectable()
export class LabelService {
  constructor(@Inject(LABEL_VALUES) private readonly config: Record<string, string>) {
  }

  public get = (key: string) => this.config[key];
}

