import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, Sequelize as SequelizeLib } from 'sequelize';
import { TxnMemberPocketGuide, TxnMember } from '../models';
import { IMemberPocketGuide } from 'eatfit247-shared-lib';
import { CommonFunctionsUtil, MstPocketGuide } from '@server/common';
import { Sequelize } from 'sequelize-typescript';

@Injectable()
export class MemberPocketGuideService {
  constructor(
    @InjectModel(TxnMemberPocketGuide) private readonly memberPocketGuideRepository: typeof TxnMemberPocketGuide,
    @InjectModel(TxnMember) private readonly memberRepository: typeof TxnMember,
    @InjectModel(MstPocketGuide) private readonly pocketGuideRepository: typeof MstPocketGuide,
    private sequelize: Sequelize,
  ) {}

  public async getList(memberId: number): Promise<Array<{ pocketGuideId: number; pocketGuide: string; selected: boolean }>> {
    // Verify member exists
    const member = await this.memberRepository.findOne({
      where: { memberId },
    });
    if (!member) {
      throw new NotFoundException('Member not found');
    }

    // Get all active pocket guides with a selection flag using a Sequelize query with subquery
    const allPocketGuides = await this.pocketGuideRepository.findAll({
      where: { active: true },
      attributes: [
        'pocketGuideId',
        'pocketGuide',
        [
          SequelizeLib.literal(`(
            SELECT CASE 
              WHEN EXISTS (
                SELECT 1 
                FROM txn_member_pocket_guides tmpg 
                WHERE tmpg.pocket_guide_id = "MstPocketGuide"."pocket_guide_id" 
                AND tmpg.member_id = ${memberId}
              ) THEN true 
              ELSE false 
            END
          )`),
          'selected',
        ],
      ],
      order: [['pocketGuide', 'ASC']],
      raw: true,
      nest: true,
    });

    return allPocketGuides.map((pg: any) => ({
      pocketGuideId: pg.pocketGuideId,
      pocketGuide: pg.pocketGuide,
      selected: pg.selected === true || pg.selected === 1,
    }));
  }

  public async manage(memberId: number, pocketGuideIds: number[], cIp: string, adminId: number): Promise<void> {
    // Verify member exists
    const member = await this.memberRepository.findOne({
      where: { memberId },
    });
    if (!member) {
      throw new NotFoundException('Member not found');
    }

    if (pocketGuideIds.length > 0) {
      const validPocketGuides = await this.pocketGuideRepository.findAll({
        where: {
          pocketGuideId: {
            [Op.in]: pocketGuideIds,
          },
          active: true,
        },
        attributes: ['pocketGuideId'],
        raw: true,
      });

      const validIds = new Set(validPocketGuides.map((pg: any) => pg.pocketGuideId));
      const invalidIds = pocketGuideIds.filter((id) => !validIds.has(id));

      if (invalidIds.length > 0) {
        throw new NotFoundException(`Invalid or inactive pocket guide IDs: ${invalidIds.join(', ')}`);
      }
    }

    // Use transaction for atomic operation
    const transaction = await this.sequelize.transaction();

    try {
      // Remove existing associations
      await this.memberPocketGuideRepository.destroy({
        where: { memberId },
        transaction,
      });

      // Create new associations
      if (pocketGuideIds.length > 0) {
        const createData = pocketGuideIds.map((pocketGuideId) => ({
          memberId,
          pocketGuideId,
          createdBy: adminId,
          modifiedBy: adminId,
          createdIp: cIp,
          modifiedIp: cIp,
        }));

        await this.memberPocketGuideRepository.bulkCreate(createData, { transaction });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  public async findByMemberId(memberId: number): Promise<IMemberPocketGuide[]> {
    const records = await this.memberPocketGuideRepository.scope('details').findAll({
      where: { memberId },
      order: [['pocketGuideId', 'ASC']],
      raw: true,
      nest: true,
    });

    return records.map((item: any) => this.convertToModel(item));
  }

  private convertToModel(item: any): IMemberPocketGuide {
    return {
      memberPocketGuideId: item.memberPocketGuideId,
      memberId: item.memberId,
      pocketGuideId: item.pocketGuideId,
      pocketGuide: item.pocketGuide.pocketGuide,
      createdBy: item.createdBy,
      updatedBy: item.modifiedBy,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      createdByUser: item.createdByUser
        ? CommonFunctionsUtil.getAdminShortInfo(item.createdByUser, 'createdByUser')
        : undefined,
      updatedByUser: item.updatedByUser
        ? CommonFunctionsUtil.getAdminShortInfo(item.updatedByUser, 'updatedByUser')
        : undefined,
    };
  }
}
