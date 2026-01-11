import { DynamicModule, Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { AppConfigService } from './app-config.service';
import { APP_CONFIG_VALUES, AppConfigFactory } from './app-config.factory';
import { AppConfigModel } from '../../database/models';

@Module({})
export class AppConfigModule {
  static asyncRegister(modules: string[]): DynamicModule {
    return {
      module: AppConfigModule,
      global: true,
      imports: [
        // Import SequelizeModule to make connection available for injection
        SequelizeModule.forFeature([AppConfigModel]),
      ],
      providers: [
        AppConfigFactory,
        {
          provide: APP_CONFIG_VALUES,
          useFactory: async (factory: AppConfigFactory) => {
            return await factory.create(modules);
          },
          inject: [AppConfigFactory],
        },
        AppConfigService,
      ],
      exports: [AppConfigService],
    };
  }
}

