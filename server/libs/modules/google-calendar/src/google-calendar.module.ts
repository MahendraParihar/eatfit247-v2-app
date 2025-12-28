import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { MstAdminUser } from '@server/common';
import { GoogleCalendarController } from './controllers';
import { GoogleCalendarService } from './services';

@Module({
  imports: [
    SequelizeModule.forFeature([
      MstAdminUser,
    ]),
  ],
  controllers: [
    GoogleCalendarController,
  ],
  providers: [
    GoogleCalendarService,
  ],
  exports: [
    GoogleCalendarService,
    SequelizeModule,
  ],
})
export class GoogleCalendarModule {
}
