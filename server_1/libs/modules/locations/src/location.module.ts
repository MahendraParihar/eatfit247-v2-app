import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import {
  AddressController,
  CountryController,
  PublicAddressController,
  StateController,
} from './controllers';

@Module({
  imports: [
    SequelizeModule.forFeature([]),
  ],
  controllers: [
    PublicAddressController, // Register public controller first to avoid route conflicts
    CountryController,
    StateController,
    AddressController,
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

