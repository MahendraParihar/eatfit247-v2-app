import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ExceptionService } from '../../common/exception.service';
import { Sequelize } from 'sequelize-typescript';
import { IServerResponse } from '../../../common-dto/response-interface';
import { ADMIN_USER_SHORT_INFO_ATTRIBUTE, DEFAULT_DATE_TIME_FORMAT, IS_DEV } from '../../../constants/config-constants';
import { ServerResponseEnum } from '../../../enums/server-response-enum';
import { StringResource } from '../../../enums/string-resource';
import { TxnMemberPocketGuide } from '../../../core/database/models/txn-member-pocket-guide.model';
import { MstPocketGuide } from '../../../core/database/models/mst-pocket-guide.model';
import { IMemberPocketGuide } from '../../../response-interface/member-pocket-guide.interface';
import { MstAdminUser } from '../../../core/database/models/mst-admin-user.model';
import { CommonFunctionsUtil } from '../../../util/common-functions-util';
import * as moment from 'moment';
import * as _ from 'lodash';
import { CreateMemberPocketGuideDto } from '../dto/member-pocket-guide.dto';

@Injectable()
export class MemberPocketGuideService {
  constructor(
    @InjectModel(TxnMemberPocketGuide) private readonly memberPocketGuideRepository: typeof TxnMemberPocketGuide,
    @InjectModel(MstPocketGuide) private readonly pocketGuideRepository: typeof MstPocketGuide,
    private exceptionService: ExceptionService,
    private sequelize: Sequelize,
  ) {
  }

  public async fetchMemberPocketGuide(id: number): Promise<IServerResponse> {
    let res: IServerResponse;
    try {
      MstPocketGuide.belongsTo(TxnMemberPocketGuide, {
        targetKey: 'pocketGuideId',
        foreignKey: 'pocketGuideId',
      });
      const { rows, count } = await this.pocketGuideRepository.findAndCountAll({
        include: [
          {
            attributes: ['memberPocketGuideId', 'createdAt', 'updatedAt'],
            model: TxnMemberPocketGuide,
            required: true,
            where: {
              memberId: id,
            },
            include: [
              {
                model: MstAdminUser,
                required: false,
                as: 'CreatedBy',
                attributes: ADMIN_USER_SHORT_INFO_ATTRIBUTE,
              },
              {
                model: MstAdminUser,
                required: false,
                as: 'ModifiedBy',
                attributes: ADMIN_USER_SHORT_INFO_ATTRIBUTE,
              },
            ],
          },
        ],
        where: {
          active: true,
        },
        order: [['pocketGuide', 'ASC']],
        raw: true,
        nest: true,
      });

      if (!rows || rows.length === 0) {
        res = {
          code: ServerResponseEnum.WARNING,
          message: StringResource.NO_DATA_FOUND,
          data: null,
        };
        return res;
      }

      const resList: IMemberPocketGuide[] = [];
      for (const s of rows) {
        resList.push(<IMemberPocketGuide>{
          id: s.pocketGuideId,
          name: s.pocketGuide,
          description: s.description,
          isSelected: !!s['txn_member_pocket_guide']['memberPocketGuideId'],
          active: s.active,
          imagePath: CommonFunctionsUtil.getImagesObj(s.imagePath),
          filePath: CommonFunctionsUtil.getImagesObj(s.filePath),
          createdBy: CommonFunctionsUtil.getAdminShortInfo(s['txn_member_pocket_guide']['CreatedBy'], 'CreatedBy'),
          updatedBy: CommonFunctionsUtil.getAdminShortInfo(s['txn_member_pocket_guide']['ModifiedBy'], 'ModifiedBy'),
          createdAt: s['txn_member_pocket_guide'].createdAt
            ? moment(s['txn_member_pocket_guide'].createdAt).format(DEFAULT_DATE_TIME_FORMAT)
            : null,
          updatedAt: s['txn_member_pocket_guide'].updatedAt
            ? moment(s['txn_member_pocket_guide'].updatedAt).format(DEFAULT_DATE_TIME_FORMAT)
            : null,
        });
      }

      res = {
        code: ServerResponseEnum.SUCCESS,
        message: StringResource.SUCCESS,
        data: {
          list: resList,
          count: count,
        },
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

  public async fetchById(id: number): Promise<IServerResponse> {
    let res: IServerResponse;
    try {
      MstPocketGuide.belongsTo(TxnMemberPocketGuide, {
        targetKey: 'pocketGuideId',
        foreignKey: 'pocketGuideId',
      });
      const { rows, count } = await this.pocketGuideRepository.findAndCountAll({
        include: [
          {
            attributes: ['memberPocketGuideId', 'createdAt', 'updatedAt'],
            model: TxnMemberPocketGuide,
            required: false,
            where: {
              memberId: id,
            },
            include: [
              {
                model: MstAdminUser,
                required: false,
                as: 'CreatedBy',
                attributes: ADMIN_USER_SHORT_INFO_ATTRIBUTE,
              },
              {
                model: MstAdminUser,
                required: false,
                as: 'ModifiedBy',
                attributes: ADMIN_USER_SHORT_INFO_ATTRIBUTE,
              },
            ],
          },
        ],
        where: {
          active: true,
        },
        order: [['pocketGuide', 'ASC']],
        raw: true,
        nest: true,
      });

      if (!rows || rows.length === 0) {
        res = {
          code: ServerResponseEnum.WARNING,
          message: StringResource.NO_DATA_FOUND,
          data: null,
        };
        return res;
      }

      const resList: IMemberPocketGuide[] = [];
      for (const s of rows) {
        resList.push(<IMemberPocketGuide>{
          id: s.pocketGuideId,
          name: s.pocketGuide,
          description: s.description,
          isSelected: !!s['txn_member_pocket_guide']['memberPocketGuideId'],
          active: s.active,
          imagePath: CommonFunctionsUtil.getImagesObj(s.imagePath),
          filePath: CommonFunctionsUtil.getImagesObj(s.filePath),
          createdBy: CommonFunctionsUtil.getAdminShortInfo(s['txn_member_pocket_guide']['CreatedBy'], 'CreatedBy'),
          updatedBy: CommonFunctionsUtil.getAdminShortInfo(s['txn_member_pocket_guide']['ModifiedBy'], 'ModifiedBy'),
          createdAt: s['txn_member_pocket_guide'].createdAt
            ? moment(s['txn_member_pocket_guide'].createdAt).format(DEFAULT_DATE_TIME_FORMAT)
            : null,
          updatedAt: s['txn_member_pocket_guide'].updatedAt
            ? moment(s['txn_member_pocket_guide'].updatedAt).format(DEFAULT_DATE_TIME_FORMAT)
            : null,
        });
      }

      res = {
        code: ServerResponseEnum.SUCCESS,
        message: StringResource.SUCCESS,
        data: {
          list: resList,
          count: count,
        },
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

  public async createOrUpdate(
    memberId: number,
    obj: CreateMemberPocketGuideDto,
    cIp: string,
    adminId: number,
  ): Promise<IServerResponse> {
    let res: IServerResponse;
    try {
      const existingData = await this.findAllById(memberId);
      const existingPocketGuideIds = _.map(existingData, 'pocketGuideId');
      if (_.isEqual(existingPocketGuideIds, obj.pocketGuideIds)) {
        res = {
          code: ServerResponseEnum.SUCCESS,
          message: StringResource.SUCCESS,
          data: null,
        };
        return res;
      }

      await this.memberPocketGuideRepository.destroy({ where: { memberId: memberId } });

      if (obj.pocketGuideIds && obj.pocketGuideIds.length > 0) {
        const tempList = [];
        for (const s of obj.pocketGuideIds) {
          tempList.push({
            memberId: memberId,
            pocketGuideId: s,
            createdBy: adminId,
            modifiedBy: adminId,
            createdIp: cIp,
            modifiedIp: cIp,
          });
        }
        await this.memberPocketGuideRepository.bulkCreate(tempList);
      }
      // check if pocket guide section change
      if (
        !_.isEqual(existingPocketGuideIds, obj.pocketGuideIds) &&
        obj.pocketGuideIds &&
        obj.pocketGuideIds.length > 0
      ) {
        // TODO SEND MAIL
      }

      res = {
        code: ServerResponseEnum.SUCCESS,
        message: StringResource.SUCCESS,
        data: null,
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

  public async findAllById(memberId: number): Promise<TxnMemberPocketGuide[]> {
    return await this.memberPocketGuideRepository.findAll<TxnMemberPocketGuide>({
      where: { memberId: memberId },
      include: [
        {
          model: MstPocketGuide,
          required: true,
          as: 'MemberPocketGuidePocketGuide',
          attributes: ['pocketGuide'],
        },
      ],
      raw: true,
      nest: true,
    });
  }
}
