import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { LegalPagesModel } from './models';
import { SeoPageModel } from '@server_1/platform';
import { modelRegistry } from '@server_1/core';
import { LegalPagesService } from './services';
import { SeoPageService } from '@server_1/platform';
import { LegalPagesController } from './controllers';
import { SeoPageAdminController } from './controllers/admin/seo-page.controller';
// Register models with the model registry
// Note: SeoPageModel is already registered via PlatformModule.getModels(), so only register LegalPagesModel
modelRegistry.register([LegalPagesModel]);

/**
 * Admin-only Pages Module
 * Only includes the admin controllers
 */
@Module({
  imports: [
    SequelizeModule.forFeature([LegalPagesModel, SeoPageModel]),
  ],
  controllers: [
    LegalPagesController,
    SeoPageAdminController,
  ],
  providers: [
    LegalPagesService,
    SeoPageService,
  ],
  exports: [
    LegalPagesService,
    SeoPageService,
    SequelizeModule,
  ],
})
export class PagesAdminModule {
}

