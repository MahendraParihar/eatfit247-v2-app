import { Sequelize } from 'sequelize-typescript';
import { databaseConfig } from '../../database/db-config';
import { AppConfigModel } from '../../database/models';

async function getLocalConfiguration(module: string[]) {
  try {
    const sequelize = new Sequelize(databaseConfig);
    sequelize.addModels([AppConfigModel]);
    await sequelize.authenticate();
    const configs = await AppConfigModel.findAll({
      where: {
        module: module,
      },
      nest: true,
      raw: true,
    });
    await sequelize.close();
    return configs;
  } catch (error) {
    console.error('Error loading app configuration:', error);
    // Return empty array on error to allow app to continue
    // The factory will convert it to an empty object
    return [];
  }
}
export const APP_CONFIG_VALUES = 'APP_CONFIG_VALUES';
export async function AppConfigFactory(modules: string[]) {
  const configs = await getLocalConfiguration(modules);
  const configMap: { [key: string]: string | number | object } = {};
  if (configs && configs.length > 0) {
    for (const item of configs) {
      configMap[item.configName] = item.configValue;
    }
  }
  return configMap;
}

