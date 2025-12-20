import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { ADMIN_USER_SHORT_INFO_ATTRIBUTE, DEFAULT_DATE_TIME_FORMAT } from '../../../constants/config-constants';
import { StringResource, ITableList } from 'shared-lib';
import { MstAdminUser } from '../../../core/database/models/mst-admin-user.model';
import { CommonFunctionsUtil } from '../../../util/common-functions-util';
import moment from 'moment';
import * as _ from 'lodash';
import { TxnMemberHealthIssue } from '../../../core/database/models/txn-member-health-issue.model';
import { MstHealthIssues } from '../../../core/database/models/mst-health-issues.model';
import { CreateMemberHealthIssueDto } from '../dto/member-health-issue.dto';
import { IMemberHealthIssue } from 'shared-lib';

@Injectable()
export class MemberHealthIssueService {
  constructor(
    @InjectModel(TxnMemberHealthIssue) private readonly memberHealthIssueRepository: typeof TxnMemberHealthIssue,
    @InjectModel(MstHealthIssues) private readonly healthIssueRepository: typeof MstHealthIssues,
    private sequelize: Sequelize,
  ) {
  }

  public async fetchMemberHealthIssues(id: number): Promise<ITableList<IMemberHealthIssue>> {
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

    return <ITableList<IMemberHealthIssue>>{
      tableData: resList,
      count: count,
    };
  }

  public async fetchById(id: number): Promise<ITableList<IMemberHealthIssue>> {
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

    return <ITableList<IMemberHealthIssue>>{
      tableData: resList,
      count: count,
    };
  }

  public async createOrUpdate(
    memberId: number,
    obj: CreateMemberHealthIssueDto,
    cIp: string,
    adminId: number,
  ): Promise<void> {
    const existingData = await this.findAllById(memberId);
    const existingHealthIssueIds = _.map(existingData, 'healthIssueId');
    if (_.isEqual(existingHealthIssueIds, obj.healthIssueIds)) {
      return;
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
    // check if health issue section change
    if (
      !_.isEqual(existingHealthIssueIds, obj.healthIssueIds) &&
      obj.healthIssueIds &&
      obj.healthIssueIds.length > 0
    ) {
      // TODO SEND MAIL
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
