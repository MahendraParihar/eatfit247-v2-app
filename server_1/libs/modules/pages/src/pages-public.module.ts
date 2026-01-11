import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { LegalPagesModel, SeoPageModel } from './models';
import { modelRegistry } from '@server_1/core';
import { SeoPageService } from './services';
import { SeoPageController } from './controllers/public/seo-page.controller';

// Register models with the model registry
modelRegistry.register([LegalPagesModel, SeoPageModel]);

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
  providers: [
    SeoPageService,
  ],
  exports: [
    SeoPageService,
    SequelizeModule,
  ],
})
export class PagesPublicModule {
}

