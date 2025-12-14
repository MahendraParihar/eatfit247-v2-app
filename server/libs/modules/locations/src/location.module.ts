import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { MstAdminUser, modelRegistry } from '@server/common';
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

// Register models with the model registry
modelRegistry.register([MstCountry, MstState]);

@Module({
  imports: [
    SequelizeModule.forFeature([MstCountry, MstState]),
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

