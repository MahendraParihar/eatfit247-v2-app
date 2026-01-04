import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { LegalPagesModel } from './models';
import { modelRegistry } from '@server_1/core';
import { LegalPagesService } from './services';
import { LegalPagesController, PublicLegalPagesController } from './controllers';
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

