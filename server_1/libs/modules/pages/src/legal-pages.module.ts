import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { LegalPagesModel } from './models/legal-pages.model';
import { modelRegistry } from '@server_1/core';
import { LegalPagesService } from './services/legal-pages.service';
import { LegalPagesController, PublicLegalPagesController } from './controllers';
// Register models with the model registry
modelRegistry.register([LegalPagesModel]);

@Module({
  imports: [
    SequelizeModule.forFeature([LegalPagesModel]),
  ],
  controllers: [
    LegalPagesController,
    PublicLegalPagesController,
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

