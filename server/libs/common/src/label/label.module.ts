import { DynamicModule, Module } from '@nestjs/common';
import { LABEL_VALUES, LabelFactory } from './label.factory';
import { LabelService } from './label.service';

@Module({})
export class LabelModule {
  static asyncRegister(modules: string[]): DynamicModule {
    return {
      module: LabelModule,
      providers: [
        {
          provide: LABEL_VALUES,
          useFactory: async () => {
            return await LabelFactory(modules);
          },
        },
        LabelService,
      ],
      exports: [LabelService],
    };
  }
}

