export const LABEL_VALUES = 'LABEL_VALUES';

import { LabelDataService } from './label-data.service';

export async function LabelFactory(
  modules: string[],
  labelDataService: LabelDataService,
) {
  const configMap: { [key: string]: string } = {};

  for (const app of modules) {
    const configs = await labelDataService.load(app);
    Object.assign(configMap, configs);
  }

  return configMap;
}

