import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { LegalPagesModel, SeoPageModel } from './models';
import { modelRegistry } from '@server_1/core';
import { LegalPagesService, SeoPageService } from './services';
import { LegalPagesController } from './controllers';
import { SeoPageAdminController } from './controllers/admin/seo-page.controller';

// Register models with the model registry
modelRegistry.register([LegalPagesModel, SeoPageModel]);

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

