import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { LegalPagesModel, SeoPageModel } from './models';
import { modelRegistry } from '@server_1/core';
import { LegalPagesService, SeoPageService } from './services';
import { LegalPagesController } from './controllers';
import { SeoPageController } from './controllers/public/seo-page.controller';
import { SeoPageAdminController } from './controllers/admin/seo-page.controller';
modelRegistry.register([LegalPagesModel, SeoPageModel]);

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
    SeoPageService,
  ],
  exports: [
    LegalPagesService,
    SeoPageService,
    SequelizeModule,
  ],
})
export class LegalPagesModule {
}

