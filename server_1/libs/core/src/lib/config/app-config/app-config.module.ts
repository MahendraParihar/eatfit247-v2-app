import { DynamicModule, Module } from '@nestjs/common';
import { AppConfigService } from './app-config.service';
import { APP_CONFIG_VALUES, AppConfigFactory } from './app-config.factory';

@Module({})
export class AppConfigModule {
  static asyncRegister(modules: string[]): DynamicModule {
    return {
      module: AppConfigModule,
      global: true,
      providers: [
        {
          provide: APP_CONFIG_VALUES,
          useFactory: async () => {
            return await AppConfigFactory(modules);
          },
        },
        AppConfigService,
      ],
      exports: [AppConfigService],
    };
  }
}

