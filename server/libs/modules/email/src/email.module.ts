import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { MstAdminUser } from '@server/common';
import { MstEmailTemplate } from './models';
import {
  EmailTemplateController,
} from './controllers';
import {
  EmailTemplateService,
} from './services';

@Module({
  imports: [
    SequelizeModule.forFeature([
      MstEmailTemplate,
      MstAdminUser,
    ]),
  ],
  controllers: [
    EmailTemplateController,
  ],
  providers: [
    EmailTemplateService,
  ],
  exports: [
    EmailTemplateService,
    SequelizeModule,
  ],
})
export class EmailModule {
}

