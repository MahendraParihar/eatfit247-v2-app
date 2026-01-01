import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { MstState } from '@server_1/platform';
import {
  CountryController,
  StateController,
  AddressTypeController,
  PublicCountryController,
  PublicStateController, AddressController,
} from './controllers';

@Module({
  imports: [
    SequelizeModule.forFeature([]),
  ],
  controllers: [
    CountryController,
    StateController,
    AddressController,
    AddressTypeController,
    PublicCountryController,
    PublicStateController,
  ],
  providers: [
    // Services are now provided by CommonModule (global)
    // No need to provide them here, they're imported via CommonModule
  ],
  exports: [
    // Services are exported by CommonModule, no need to re-export
    SequelizeModule,
  ],
})
export class LocationModule {
}

