import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { AppConfigModel } from '../../database/models';

export const APP_CONFIG_VALUES = 'APP_CONFIG_VALUES';

@Injectable()
export class AppConfigFactory {
  constructor(
    @InjectConnection()
    private readonly sequelize: Sequelize,
  ) {}

  async create(modules: string[]): Promise<Record<string, string | number | object>> {
    try {
      // Use the existing Sequelize connection instead of creating a new one
      const configs = await AppConfigModel.findAll({
        where: {
          module: modules,
        },
        nest: true,
        raw: true,
      });
      
      const configMap: { [key: string]: string | number | object } = {};
      if (configs && configs.length > 0) {
        for (const item of configs) {
          configMap[item.configName] = item.configValue;
        }
      }
      return configMap;
    } catch (error) {
      console.error('Error loading app configuration:', error);
      // Return empty object on error to allow app to continue
      return {};
    }
  }
}

