import { Sequelize } from 'sequelize-typescript';
import { databaseConfig } from '../db-config';
import { LabelModel } from '../models/label.model';

async function getLocalConfiguration(applicability: string[]) {
  const sequelize = new Sequelize(databaseConfig);
  sequelize.addModels([LabelModel]);
  await sequelize.authenticate();
  return await LabelModel.findAll({
    where: {
      applicability: applicability,
    },
  });
}

export const LABEL_VALUES = 'LABEL_VALUES';

export async function LabelFactory(modules: string[]) {
  const configs = await getLocalConfiguration(modules);
  if (configs && configs.length > 0) {
    const configMap: { [key: string]: string } = {};
    for (const item of configs) {
      configMap[item.labelKey] = item.label;
    }
    return configMap;
  } else {
    return [];
  }
}

