import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { MstConfig } from "../../core/database/models/mst-config.model";
import { Sequelize } from "sequelize-typescript";
import { ConfigParamDto } from "./dto/config-parameter.dto";
import { MstFieldType } from "src/core/database/models/mst_field_type.model";

@Injectable()
export class ConfigParameterService {
  constructor(
    @InjectModel(MstConfig) private readonly configParameterRepository: typeof MstConfig,
    private sequelize: Sequelize
  ) {}

  public async findAll(): Promise<MstConfig[]> {
    return await this.configParameterRepository.findAll({
      raw: true,
      nest: true,
      include: {
        model: MstFieldType,
        required: false,
        attributes: ["fieldType"]
      }
    });
  }

  public async update(list: ConfigParamDto[], cIp: string, adminId: number): Promise<void> {
    const t = await this.sequelize.transaction();
    try {
      if (list) {
        const dbList = await this.configParameterRepository.findAll({
          raw: true,
          nest: true
        });
        let config = null;
        const promises = [];
        let promiseItem = null;
        for (const item of list) {
          config = dbList.find((x) => x.configId === item.configParamId);
          if (config?.configValue !== item.configParamValue) {
            promiseItem = MstConfig.update(
              { configValue: item.configParamValue },
              { where: { configId: item.configParamId } }
            );
            promises.push(promiseItem);
          }
        }
        await Promise.all(promises);
      }
      await t.commit();
    } catch (e) {
      await t.rollback();
      throw e;
    }
  }
}
