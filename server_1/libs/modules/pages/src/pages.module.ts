import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { LegalPagesModel } from './models';
import { SeoPageModel, SeoPageService } from '@server_1/platform';
import { modelRegistry } from '@server_1/core';
import { SeoPageController } from './controllers/public/seo-page.controller';
import { PublicLegalPagesController } from './controllers/public/legal-pages.controller';
import { LegalPagesController } from './controllers';
import { LegalPagesService } from './services';
// Register models with the model registry
// Note: SeoPageModel is already registered via PlatformModule.getModels(), so only register LegalPagesModel
modelRegistry.register([LegalPagesModel]);

/**
 * Public-only Pages Module
 * Only includes the public controllers
 */
@Module({
  imports: [SequelizeModule.forFeature([LegalPagesModel, SeoPageModel])],
  controllers: [SeoPageController, PublicLegalPagesController, LegalPagesController],
  providers: [LegalPagesService],
  exports: [SequelizeModule],
})
export class PagesModule {
}

