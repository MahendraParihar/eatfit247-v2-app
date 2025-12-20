import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { ADMIN_USER_SHORT_INFO_ATTRIBUTE, DEFAULT_DATE_TIME_FORMAT } from '../../../constants/config-constants';
import { StringResource, ITableList, IManageMemberPocketGuide } from 'shared-lib';
import { TxnMemberPocketGuide } from '../../../core/database/models/txn-member-pocket-guide.model';
import { MstPocketGuide } from '../../../core/database/models/mst-pocket-guide.model';
import { IMemberPocketGuide } from 'shared-lib';
import { MstAdminUser } from '../../../core/database/models/mst-admin-user.model';
import { CommonFunctionsUtil } from '../../../util/common-functions-util';
import moment from 'moment';
import * as _ from 'lodash';
import { CreateMemberPocketGuideDto } from '../dto/member-pocket-guide.dto';

@Injectable()
export class MemberPocketGuideService {
  constructor(
    @InjectModel(TxnMemberPocketGuide) private readonly memberPocketGuideRepository: typeof TxnMemberPocketGuide,
    @InjectModel(MstPocketGuide) private readonly pocketGuideRepository: typeof MstPocketGuide,
    private sequelize: Sequelize,
  ) {
  }

  public async fetchMemberPocketGuide(id: number): Promise<ITableList<IMemberPocketGuide>> {
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

    return <ITableList<IMemberPocketGuide>>{
      tableData: resList,
      count: count,
    };
  }

  public async fetchById(id: number): Promise<ITableList<IMemberPocketGuide>> {
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

    return <ITableList<IMemberPocketGuide>>{
      tableData: resList,
      count: count,
    };
  }

  public async createOrUpdate(
    memberId: number,
    obj: IManageMemberPocketGuide,
    cIp: string,
    adminId: number,
  ): Promise<void> {
    const existingData = await this.findAllById(memberId);
    const existingPocketGuideIds = _.map(existingData, 'pocketGuideId');
    if (_.isEqual(existingPocketGuideIds, obj.pocketGuideIds)) {
      return;
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
