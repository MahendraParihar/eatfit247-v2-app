import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { LegalPagesModel } from './models';
import { SeoPageModel, SeoPageService } from '@server_1/platform';
import { modelRegistry } from '@server_1/core';
import { SeoPageController } from './controllers/public/seo-page.controller';
// Register models with the model registry
// Note: SeoPageModel is already registered via PlatformModule.getModels(), so only register LegalPagesModel
modelRegistry.register([LegalPagesModel]);

/**
 * Public-only Pages Module
 * Only includes the public controllers
 */
@Module({
  imports: [
    SequelizeModule.forFeature([LegalPagesModel, SeoPageModel]),
  ],
  controllers: [
    SeoPageController,
  ],
  providers: [],
  exports: [
    SequelizeModule,
  ],
})
export class PagesPublicModule {
}

