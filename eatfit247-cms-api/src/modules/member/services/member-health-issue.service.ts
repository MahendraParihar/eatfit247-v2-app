import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ExceptionService } from '../../common/exception.service';
import { Sequelize } from 'sequelize-typescript';
import { IServerResponse } from '../../../common-dto/response-interface';
import { ADMIN_USER_SHORT_INFO_ATTRIBUTE, DEFAULT_DATE_TIME_FORMAT, IS_DEV } from '../../../constants/config-constants';
import { ServerResponseEnum } from '../../../enums/server-response-enum';
import { StringResource } from '../../../enums/string-resource';
import { MstAdminUser } from '../../../core/database/models/mst-admin-user.model';
import { CommonFunctionsUtil } from '../../../util/common-functions-util';
import * as moment from 'moment';
import * as _ from 'lodash';
import { TxnMemberHealthIssue } from '../../../core/database/models/txn-member-health-issue.model';
import { MstHealthIssues } from '../../../core/database/models/mst-health-issues.model';
import { CreateMemberHealthIssueDto } from '../dto/member-health-issue.dto';
import { IMemberHealthIssue } from '../../../response-interface/member-health-issue.interface';

@Injectable()
export class MemberHealthIssueService {
  constructor(
    @InjectModel(TxnMemberHealthIssue) private readonly memberHealthIssueRepository: typeof TxnMemberHealthIssue,
    @InjectModel(MstHealthIssues) private readonly healthIssueRepository: typeof MstHealthIssues,
    private exceptionService: ExceptionService,
    private sequelize: Sequelize,
  ) {
  }

  public async fetchMemberHealthIssues(id: number): Promise<IServerResponse> {
    let res: IServerResponse;
    try {
      MstHealthIssues.belongsTo(TxnMemberHealthIssue, {
        targetKey: 'healthIssueId',
        foreignKey: 'healthIssueId',
      });
      const { rows, count } = await this.healthIssueRepository.findAndCountAll({
        include: [
          {
            attributes: ['memberHealthIssueId'],
            model: TxnMemberHealthIssue,
            required: true,
            where: {
              memberId: id,
            },
          },
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
        where: {
          active: true,
        },
        order: [['healthIssue', 'ASC']],
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

      const resList: IMemberHealthIssue[] = [];
      for (const s of rows) {
        resList.push(<IMemberHealthIssue>{
          id: s.healthIssueId,
          name: s.healthIssue,
          isSelected: !!s['txn_member_health_issue']['memberHealthIssueId'],
          active: s.active,
          imagePath: CommonFunctionsUtil.getImagesObj(s.imagePath),
          createdBy: CommonFunctionsUtil.getAdminShortInfo(s['CreatedBy'], 'CreatedBy'),
          updatedBy: CommonFunctionsUtil.getAdminShortInfo(s['ModifiedBy'], 'ModifiedBy'),
          createdAt: moment(s.createdAt).format(DEFAULT_DATE_TIME_FORMAT),
          updatedAt: moment(s.updatedAt).format(DEFAULT_DATE_TIME_FORMAT),
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
      MstHealthIssues.belongsTo(TxnMemberHealthIssue, {
        targetKey: 'healthIssueId',
        foreignKey: 'healthIssueId',
      });
      const { rows, count } = await this.healthIssueRepository.findAndCountAll({
        include: [
          {
            attributes: ['memberHealthIssueId'],
            model: TxnMemberHealthIssue,
            required: false,
            where: {
              memberId: id,
            },
          },
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
        where: {
          active: true,
        },
        order: [['healthIssue', 'ASC']],
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

      const resList: IMemberHealthIssue[] = [];
      for (const s of rows) {
        resList.push(<IMemberHealthIssue>{
          id: s.healthIssueId,
          name: s.healthIssue,
          isSelected: !!s['txn_member_health_issue']['memberHealthIssueId'],
          active: s.active,
          imagePath: CommonFunctionsUtil.getImagesObj(s.imagePath),
          createdBy: CommonFunctionsUtil.getAdminShortInfo(s['CreatedBy'], 'CreatedBy'),
          updatedBy: CommonFunctionsUtil.getAdminShortInfo(s['ModifiedBy'], 'ModifiedBy'),
          createdAt: moment(s.createdAt).format(DEFAULT_DATE_TIME_FORMAT),
          updatedAt: moment(s.updatedAt).format(DEFAULT_DATE_TIME_FORMAT),
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
    obj: CreateMemberHealthIssueDto,
    cIp: string,
    adminId: number,
  ): Promise<IServerResponse> {
    let res: IServerResponse;
    try {
      const existingData = await this.findAllById(memberId);
      const existingPocketGuideIds = _.map(existingData, 'pocketGuideId');
      if (_.isEqual(existingPocketGuideIds, obj.healthIssueIds)) {
        res = {
          code: ServerResponseEnum.SUCCESS,
          message: StringResource.SUCCESS,
          data: null,
        };
        return res;
      }

      await this.memberHealthIssueRepository.destroy({ where: { memberId: memberId } });

      if (obj.healthIssueIds && obj.healthIssueIds.length > 0) {
        const tempList = [];
        for (const s of obj.healthIssueIds) {
          tempList.push({
            memberId: memberId,
            healthIssueId: s,
            createdBy: adminId,
            modifiedBy: adminId,
            createdIp: cIp,
            modifiedIp: cIp,
          });
        }
        await this.memberHealthIssueRepository.bulkCreate(tempList);
      }
      // check if pocket guide section change
      if (
        !_.isEqual(existingPocketGuideIds, obj.healthIssueIds) &&
        obj.healthIssueIds &&
        obj.healthIssueIds.length > 0
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

  public async findAllById(memberId: number): Promise<TxnMemberHealthIssue[]> {
    return await this.memberHealthIssueRepository.findAll<TxnMemberHealthIssue>({
      where: { memberId: memberId },
      include: [
        {
          model: MstHealthIssues,
          required: true,
          as: 'HealthIssueMemberMap',
          attributes: ['healthIssue'],
        },
      ],
      raw: true,
      nest: true,
    });
  }
}
