import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ExceptionService } from '../common/exception.service';
import { MstConfig } from '../../core/database/models/mst-config.model';
import { IServerResponse } from 'src/common-dto/response-interface';
import { ServerResponseEnum } from 'src/enums/server-response-enum';
import { StringResource } from 'src/enums/string-resource';
import { IS_DEV } from 'src/constants/config-constants';
import { MstFieldType } from 'src/core/database/models/mst_field_type.model';
import { ConfigParamDto } from './dto/config-parameter.dto';
import { Sequelize } from 'sequelize-typescript';

@Injectable()
export class ConfigParameterService {
  constructor(
    @InjectModel(MstConfig) private readonly configParameterRepository: typeof MstConfig,
    private exceptionService: ExceptionService,
    private sequelize: Sequelize,
  ) {}

  public async findAll(): Promise<IServerResponse> {
    let res: IServerResponse;
    try {
      const list: MstConfig[] = await this.configParameterRepository.findAll({
        raw: true,
        nest: true,
        include: {
          model: MstFieldType,
          required: false,
          attributes: ['fieldType'],
        },
      });
      res = {
        code: ServerResponseEnum.SUCCESS,
        message: StringResource.SUCCESS,
        data: list,
      };

      return res;
    } catch (e) {
      this.exceptionService.logError(e);
      res = {
        code: ServerResponseEnum.ERROR,
        message: IS_DEV ? e['message'] : StringResource.SOMETHING_WENT_WRONG,
        data: null,
      };
      return res;
    }
  }

  public async update(list: ConfigParamDto[], cIp: string, adminId: number): Promise<IServerResponse> {
    let res: IServerResponse;

    const t = await this.sequelize.transaction();

    try {
      if (list) {
        const dbList = await this.configParameterRepository.findAll({
          raw: true,
          nest: true,
        });

        let config = null;
        const promises = [];
        let promiseItem = null;

        for (const item of list) {
          config = dbList.find((x) => x.configId === item.configParamId);

          if (config?.configValue !== item.configParamValue) {
            promiseItem = MstConfig.update(
              { configValue: item.configParamValue },
              { where: { configId: item.configParamId } },
            );
            promises.push(promiseItem);
          }
        }

        const result = await Promise.all(promises);
      }

      await t.commit();
      res = {
        code: ServerResponseEnum.SUCCESS,
        message: StringResource.SUCCESS_DATA_UPDATE,
        data: null,
      };

      return res;
    } catch (e) {
      await t.rollback();

      this.exceptionService.logError(e);
      res = {
        code: ServerResponseEnum.ERROR,
        message: IS_DEV ? e['message'] : StringResource.SOMETHING_WENT_WRONG,
        data: null,
      };
      return res;
    }
  }
}
