import { DynamicModule, Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { LabelModel } from '../database/models';
import { LABEL_VALUES, LabelFactory } from './label.factory';
import { LabelService } from './label.service';
import { LabelDataService } from './label-data.service';

@Module({})
export class LabelModule {
  static asyncRegister(modules: string[]): DynamicModule {
    return {
      module: LabelModule,
      imports: [SequelizeModule.forFeature([LabelModel])],
      providers: [
        LabelDataService,
        {
          provide: LABEL_VALUES,
          useFactory: async (labelDataService: LabelDataService) => {
            return await LabelFactory(modules, labelDataService);
          },
          inject: [LabelDataService],
        },
        LabelService,
      ],
      exports: [LabelService],
    };
  }
}

