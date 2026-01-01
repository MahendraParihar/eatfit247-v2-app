import { Sequelize } from 'sequelize-typescript';
import { databaseConfig } from '../../database/db-config';
import { AppConfigModel } from '../../database/models';

async function getLocalConfiguration(module: string[]) {
  const sequelize = new Sequelize(databaseConfig);
  sequelize.addModels([AppConfigModel]);
  await sequelize.authenticate();
  return await AppConfigModel.findAll({
    where: {
      module: module,
    },
    nest: true,
    raw: true,
  });
}
export const APP_CONFIG_VALUES = 'APP_CONFIG_VALUES';
export async function AppConfigFactory(modules: string[]) {
  const configs = await getLocalConfiguration(modules);
  if (configs && configs.length > 0) {
    const configMap: { [key: string]: string | number | object } = {};
    for (const item of configs) {
      configMap[item.configName] = item.configValue;
    }
    return configMap;
  } else {
    return [];
  }
}

