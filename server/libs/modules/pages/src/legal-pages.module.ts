import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { MstAdminUser } from '@server/common';
import { LegalPagesModel } from './models/legal-pages.model';
import { LegalPagesService } from './services/legal-pages.service';
import { LegalPagesController, PublicLegalPagesController } from './controllers';

@Module({
  imports: [
    SequelizeModule.forFeature([LegalPagesModel, MstAdminUser]),
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

