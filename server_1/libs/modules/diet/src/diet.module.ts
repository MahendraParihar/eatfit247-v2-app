import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { modelRegistry } from '@server_1/core';
import { TxnDietTemplate, TxnDietTemplateDietDetail } from './models';
import { DietTemplateController } from './controllers';
import { DietTemplateService } from './services';

// Register models with the model registry
modelRegistry.register([
  TxnDietTemplate,
  TxnDietTemplateDietDetail,
]);

@Module({
  imports: [
    SequelizeModule.forFeature([
      TxnDietTemplate,
      TxnDietTemplateDietDetail,
    ]),
  ],
  controllers: [
    DietTemplateController,
  ],
  providers: [
    DietTemplateService,
  ],
  exports: [
    DietTemplateService,
    SequelizeModule,
  ],
})
export class DietModule {
}
