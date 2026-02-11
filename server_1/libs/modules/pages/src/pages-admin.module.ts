import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { LegalPagesModel } from './models';
import { SeoPageModel } from '@server_1/platform';
import { modelRegistry } from '@server_1/core';
import { SeoPageAdminController, LegalPagesController } from './controllers/admin';
import { LegalPagesService } from './services';

// Register models with the model registry
// Note: SeoPageModel is already registered via PlatformModule.getModels(),
// so only register LegalPagesModel here
modelRegistry.register([LegalPagesModel]);

/**
 * Admin-only Pages Module
 * Only includes the admin controllers
 */
@Module({
  imports: [SequelizeModule.forFeature([LegalPagesModel, SeoPageModel])],
  controllers: [SeoPageAdminController, LegalPagesController],
  providers: [LegalPagesService],
  exports: [LegalPagesService, SequelizeModule],
})
export class PagesAdminModule {}


