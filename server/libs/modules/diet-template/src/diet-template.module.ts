import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { modelRegistry, MstAdminUser } from '@server/common';
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
      MstAdminUser,
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
export class DietTemplateModule {
}
