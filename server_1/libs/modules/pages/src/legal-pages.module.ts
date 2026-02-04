import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { LegalPagesModel } from './models';
import { SeoPageModel, SeoPageService } from '@server_1/platform';
import { modelRegistry } from '@server_1/core';
import { LegalPagesService } from './services';
import { LegalPagesController } from './controllers';
import { SeoPageController } from './controllers/public/seo-page.controller';
import { SeoPageAdminController } from './controllers/admin/seo-page.controller';

// Register models with the model registry
// Note: SeoPageModel is already registered via PlatformModule.getModels(), so only register LegalPagesModel
modelRegistry.register([LegalPagesModel]);

@Module({
  imports: [
    SequelizeModule.forFeature([LegalPagesModel, SeoPageModel]),
  ],
  controllers: [
    LegalPagesController,
    SeoPageAdminController,
    SeoPageController,
  ],
  providers: [
    LegalPagesService,
  ],
  exports: [
    LegalPagesService,
    SequelizeModule,
  ],
})
export class LegalPagesModule {
}

