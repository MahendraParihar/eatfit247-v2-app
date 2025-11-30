import { InjectModel } from '@nestjs/sequelize';
import { LabelModel } from '../models/label.model';

export class LabelDataService {
  constructor(@InjectModel(LabelModel) private labelModel: typeof LabelModel) {
  }

  async load(app: string): Promise<{ [p: string]: string }> {
    const configs = await this.labelModel.findAll({
      where: {
        applicability: app,
      },
    });
    const configMap: { [key: string]: string } = {};
    for (const item of configs) {
      configMap[item.labelKey] = item.label;
    }
    return configMap;
  }
}

