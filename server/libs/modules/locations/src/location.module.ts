import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { MstAdminUser } from '@server/common';
import { MstCountry, MstState } from './models';
import {
  CountryController,
  StateController,
  PublicCountryController,
  PublicStateController,
} from './controllers';
import {
  CountryService,
  StateService,
} from './services';

@Module({
  imports: [
    SequelizeModule.forFeature([MstCountry, MstState, MstAdminUser]),
  ],
  controllers: [
    CountryController,
    StateController,
    PublicCountryController,
    PublicStateController,
  ],
  providers: [
    CountryService,
    StateService,
  ],
  exports: [
    CountryService,
    StateService,
    SequelizeModule,
  ],
})
export class LocationModule {
}

