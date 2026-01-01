import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { TxnMemberPocketGuide, TxnMember } from '../models';
import { IMemberPocketGuide, IEmailData, EmailTemplateEnum, ITableList } from '@eatfit247-shared-lib';
import {
  CommonFunctionsUtil,
  MstPocketGuide,
  EmailNotificationService,
  MstAdminUser,
  ADMIN_USER_SHORT_INFO_ATTRIBUTE,
} from '@server/common';
import { Sequelize } from 'sequelize-typescript';

@Injectable()
export class MemberPocketGuideService {
  constructor(
    @InjectModel(TxnMemberPocketGuide)
    private readonly memberPocketGuideRepository: typeof TxnMemberPocketGuide,
    @InjectModel(TxnMember) private readonly memberRepository: typeof TxnMember,
    @InjectModel(MstPocketGuide) private readonly pocketGuideRepository: typeof MstPocketGuide,
    private sequelize: Sequelize,
    private readonly emailNotificationService: EmailNotificationService,
  ) {}

  public async getList(
    memberId: number,
    required: boolean = false,
  ): Promise<ITableList<IMemberPocketGuide>> {
    // Verify member exists
    const member = await this.memberRepository.findOne({
      where: { memberId },
    });
    if (!member) {
      throw new NotFoundException('Member not found');
    }
    MstPocketGuide.belongsTo(TxnMemberPocketGuide, {
      targetKey: 'pocketGuideId',
      foreignKey: 'pocketGuideId',
    });
    const { rows, count } = await this.pocketGuideRepository.findAndCountAll({
      include: [
        {
          attributes: ['memberPocketGuideId', 'createdAt', 'updatedAt'],
          model: TxnMemberPocketGuide,
          required: required,
          where: {
            memberId: memberId,
          },
          include: [
            {
              model: MstAdminUser,
              required: false,
              as: 'createdByUser',
              attributes: ADMIN_USER_SHORT_INFO_ATTRIBUTE,
            },
            {
              model: MstAdminUser,
              required: false,
              as: 'updatedByUser',
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
    return <ITableList<IMemberPocketGuide>>{
      count: count,
      tableData: rows.map((item: any) => this.convertToModel(item, memberId)),
    };
  }

  public async manage(
    memberId: number,
    pocketGuideIds: number[],
    cIp: string,
    adminId: number,
  ): Promise<void> {
    // Verify member exists
    const member = await this.memberRepository.findOne({
      where: { memberId },
      attributes: ['memberId', 'emailId', 'firstName', 'lastName'],
    });
    if (!member) {
      throw new NotFoundException('Member not found');
    }
    // Get existing pocket guide IDs before update
    const existingPocketGuides = await this.memberPocketGuideRepository.findAll({
      where: { memberId },
      attributes: ['pocketGuideId'],
      raw: true,
    });
    const existingIds = new Set(existingPocketGuides.map((pg: any) => pg.pocketGuideId));
    if (pocketGuideIds.length > 0) {
      const validPocketGuides = await this.pocketGuideRepository.findAll({
        where: {
          pocketGuideId: {
            [Op.in]: pocketGuideIds,
          },
          active: true,
        },
        attributes: ['pocketGuideId', 'pocketGuide'],
        raw: true,
      });
      const validIds = new Set(validPocketGuides.map((pg: any) => pg.pocketGuideId));
      const invalidIds = pocketGuideIds.filter((id) => !validIds.has(id));
      if (invalidIds.length > 0) {
        throw new NotFoundException(
          `Invalid or inactive pocket guide IDs: ${invalidIds.join(', ')}`,
        );
      }
      // Find new pocket guides (ones that weren't previously assigned)
      const newPocketGuideIds = pocketGuideIds.filter((id) => !existingIds.has(id));
      // Use transaction for atomic operation
      const transaction = await this.sequelize.transaction();
      try {
        // Remove existing associations
        await this.memberPocketGuideRepository.destroy({
          where: { memberId },
          transaction,
        });
        // Create new associations
        const createData = pocketGuideIds.map((pocketGuideId) => ({
          memberId,
          pocketGuideId,
          createdBy: adminId,
          modifiedBy: adminId,
          createdIp: cIp,
          modifiedIp: cIp,
        }));
        await this.memberPocketGuideRepository.bulkCreate(createData, { transaction });
        await transaction.commit();
        // Send email for new pocket guides
        if (newPocketGuideIds.length > 0 && member.emailId) {
          const newPocketGuides = validPocketGuides.filter((pg: any) =>
            newPocketGuideIds.includes(pg.pocketGuideId),
          );
          const pocketGuideNames = newPocketGuides.map((pg: any) => pg.pocketGuide).join(', ');
          try {
            const emailData: IEmailData = {
              to: member.emailId,
              type: EmailTemplateEnum.POCKET_GUIDE_ASSIGNED,
              data: {
                memberName: `${member.firstName} ${member.lastName}`,
                pocketGuideNames: pocketGuideNames,
                pocketGuideCount: newPocketGuides.length,
              },
            };
            await this.emailNotificationService.sendEmailByType(emailData);
          } catch (emailError) {
            // Log error but don't fail the operation
            console.error('Failed to send pocket guide email:', emailError);
          }
        }
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    } else {
      // If no pocket guides selected, just remove existing ones
      await this.memberPocketGuideRepository.destroy({
        where: { memberId },
      });
    }
  }

  private convertToModel(item: any, memberId: number): IMemberPocketGuide {
    const txnMemberPocketGuide = item['txn_member_pocket_guide'];
    return {
      memberId: memberId,
      memberPocketGuideId: txnMemberPocketGuide?.memberPocketGuideId,
      pocketGuideId: item.pocketGuideId,
      pocketGuide: item.pocketGuide,
      isSelected: !!txnMemberPocketGuide?.memberPocketGuideId,
      createdBy: txnMemberPocketGuide?.createdBy,
      updatedBy: txnMemberPocketGuide?.modifiedBy,
      createdAt: txnMemberPocketGuide?.createdAt,
      updatedAt: txnMemberPocketGuide?.updatedAt,
      createdByUser: txnMemberPocketGuide?.createdByUser
        ? CommonFunctionsUtil.getAdminShortInfo(txnMemberPocketGuide.createdByUser, 'createdByUser')
        : undefined,
      updatedByUser: txnMemberPocketGuide?.updatedByUser
        ? CommonFunctionsUtil.getAdminShortInfo(txnMemberPocketGuide.updatedByUser, 'updatedByUser')
        : undefined,
    };
  }
}
