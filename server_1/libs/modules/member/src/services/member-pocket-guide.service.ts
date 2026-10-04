import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Includeable, Op } from 'sequelize';
import { TxnMember, TxnMemberPocketGuide } from '../models';
import {
  ADMIN_USER_SHORT_INFO_ATTRIBUTE,
  IAuthUser,
  IEmailAttachment,
  IMediaUpload,
  IMemberPocketGuide,
  ITableList,
} from '@eatfit247-shared-lib';
import { CommonFunctionsUtil, MstAdminUser } from '@server_1/core';
import { IPocketGuideFile, MstPocketGuide, PocketGuideFileUtil } from '@server_1/modules/pocket-guide';
import { Sequelize } from 'sequelize-typescript';
import { EmailNotificationService } from '@server_1/platform';

export const POCKET_GUIDE_ASSIGNED_TEMPLATE = 'member_pocket_guide_assigned';
/** Total attachment budget per assignment email; guides beyond it are listed as "shared separately". */
export const POCKET_GUIDE_EMAIL_ATTACHMENT_LIMIT_BYTES = 15 * 1024 * 1024;

export interface IAssignedPocketGuide {
  pocketGuideId: number;
  pocketGuide: string;
  filePath: IMediaUpload[] | null;
}

export interface IPocketGuideEmailRecipient {
  memberId: number;
  emailId: string;
  memberName: string;
  franchiseName?: string;
}

@Injectable()
export class MemberPocketGuideService {
  private readonly logger = new Logger(MemberPocketGuideService.name);

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
    required: boolean,
    user: IAuthUser,
  ): Promise<ITableList<IMemberPocketGuide>> {
    await this.findMemberInScope(memberId, user, ['memberId', 'franchiseId']);
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
      // Assigned guides stay visible (and downloadable) after deactivation; the picker offers active ones only
      where: required ? {} : { active: true },
      order: [['pocketGuide', 'ASC']],
      raw: true,
      nest: true,
    });
    return <ITableList<IMemberPocketGuide>>{
      count: count,
      tableData: rows.map((item: any) => this.convertToModel(item, memberId)),
    };
  }

  /**
   * Replaces the member's assignments with `pocketGuideIds` and emails the newly assigned guides.
   * Inactive guides that are already assigned are kept: the picker only offers active guides,
   * so their absence from the submitted list is not an unassignment.
   */
  public async manage(memberId: number, pocketGuideIds: number[], cIp: string, user: IAuthUser): Promise<void> {
    const member = await this.findMemberInScope(
      memberId,
      user,
      ['memberId', 'franchiseId', 'emailId', 'firstName', 'lastName'],
      [{ association: 'franchise', attributes: ['companyName'], required: false }],
    );
    const existingAssignments = (await this.memberPocketGuideRepository.findAll({
      where: { memberId },
      attributes: ['pocketGuideId'],
      raw: true,
    })) as unknown as Array<{ pocketGuideId: number }>;
    const existingIds = existingAssignments.map((assignment) => assignment.pocketGuideId);
    const requestedIds = [...new Set(pocketGuideIds)];

    // A requested guide must be active, unless it is already assigned
    const validPocketGuides = requestedIds.length
      ? ((await this.pocketGuideRepository.findAll({
          where: {
            pocketGuideId: { [Op.in]: requestedIds },
            [Op.or]: [{ active: true }, { pocketGuideId: { [Op.in]: existingIds } }],
          },
          attributes: ['pocketGuideId', 'pocketGuide', 'filePath'],
          raw: true,
        })) as unknown as IAssignedPocketGuide[])
      : [];
    const validIds = new Set(validPocketGuides.map((pg) => pg.pocketGuideId));
    const invalidIds = requestedIds.filter((id) => !validIds.has(id));
    if (invalidIds.length > 0) {
      throw new NotFoundException(`Invalid or inactive pocket guide IDs: ${invalidIds.join(', ')}`);
    }

    const inactiveAssigned = existingIds.length
      ? ((await this.pocketGuideRepository.findAll({
          where: { pocketGuideId: { [Op.in]: existingIds }, active: false },
          attributes: ['pocketGuideId'],
          raw: true,
        })) as unknown as Array<{ pocketGuideId: number }>)
      : [];
    const finalIds = [...new Set([...requestedIds, ...inactiveAssigned.map((pg) => pg.pocketGuideId)])];
    const newPocketGuideIds = requestedIds.filter((id) => !existingIds.includes(id));

    const transaction = await this.sequelize.transaction();
    try {
      await this.memberPocketGuideRepository.destroy({ where: { memberId }, transaction });
      if (finalIds.length > 0) {
        await this.memberPocketGuideRepository.bulkCreate(
          finalIds.map((pocketGuideId) => ({
            memberId,
            pocketGuideId,
            createdBy: user.adminId,
            modifiedBy: user.adminId,
            createdIp: cIp,
            modifiedIp: cIp,
          })),
          { transaction },
        );
      }
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }

    // Email the newly assigned guides; fire-and-forget so SMTP never delays or fails the save
    if (newPocketGuideIds.length > 0 && member.emailId) {
      const recipient: IPocketGuideEmailRecipient = {
        memberId,
        emailId: member.emailId,
        memberName: `${member.firstName ?? ''} ${member.lastName ?? ''}`.trim(),
        franchiseName: member.franchise?.companyName || undefined,
      };
      const newPocketGuides = validPocketGuides.filter((pg) => newPocketGuideIds.includes(pg.pocketGuideId));
      this.sendAssignmentEmail(recipient, newPocketGuides).catch((emailError: Error) => {
        this.logger.error(`Failed to send pocket guide email for member ${memberId}: ${emailError.message}`);
      });
    }
  }

  /**
   * PDF of a guide assigned to this member. 404 when the member is outside the caller's
   * franchises (empty franchiseIds = unscoped, e.g. Super Admin), when the guide isn't
   * assigned to the member, or when the file is absent. Inactive guides are allowed.
   */
  public async getDownloadFile(memberId: number, pocketGuideId: number, user: IAuthUser): Promise<IPocketGuideFile> {
    await this.findMemberInScope(memberId, user, ['memberId', 'franchiseId']);
    const assignment = await this.memberPocketGuideRepository.findOne({
      where: { memberId, pocketGuideId },
      attributes: ['memberPocketGuideId'],
    });
    if (!assignment) {
      throw new NotFoundException('Pocket guide is not assigned to this member');
    }
    const guide = await this.pocketGuideRepository.findOne({
      where: { pocketGuideId },
      attributes: ['pocketGuideId', 'pocketGuide', 'filePath'],
    });
    if (!guide) {
      throw new NotFoundException('Pocket guide not found');
    }
    const lookup = await PocketGuideFileUtil.locate(guide.pocketGuide, guide.filePath);
    if (lookup.found === false) {
      if (lookup.reason === 'missing') {
        this.logger.error(`Pocket guide ${pocketGuideId} file missing on disk: ${lookup.reference}`);
        throw new NotFoundException('Pocket guide file is missing on the server');
      }
      throw new NotFoundException('This pocket guide has no file');
    }
    return lookup.file;
  }

  /**
   * Assignment email with the newly assigned PDFs attached, up to
   * POCKET_GUIDE_EMAIL_ATTACHMENT_LIMIT_BYTES in total. Guides whose file is missing or
   * doesn't fit are logged and listed in the email as shared separately; the email still goes.
   */
  public async sendAssignmentEmail(
    recipient: IPocketGuideEmailRecipient,
    pocketGuides: IAssignedPocketGuide[],
  ): Promise<void> {
    const template = await this.emailNotificationService.getNotificationTemplate(POCKET_GUIDE_ASSIGNED_TEMPLATE);
    if (!template) {
      this.logger.warn(`Template ${POCKET_GUIDE_ASSIGNED_TEMPLATE} not found or inactive; skipping email`);
      return;
    }
    const attachments: IEmailAttachment[] = [];
    const guides: Array<{ name: string; attached: boolean }> = [];
    let totalBytes = 0;
    for (const pocketGuide of pocketGuides) {
      const lookup = await PocketGuideFileUtil.locate(pocketGuide.pocketGuide, pocketGuide.filePath);
      let attached = false;
      if (lookup.found === false) {
        if (lookup.reason === 'missing') {
          this.logger.error(
            `Pocket guide ${pocketGuide.pocketGuideId} file missing on disk (${lookup.reference}); emailing member ${recipient.memberId} without it`,
          );
        }
      } else if (totalBytes + lookup.file.size > POCKET_GUIDE_EMAIL_ATTACHMENT_LIMIT_BYTES) {
        this.logger.warn(
          `Pocket guide ${pocketGuide.pocketGuideId} (${lookup.file.size} bytes) exceeds the email attachment limit for member ${recipient.memberId}; not attached`,
        );
      } else {
        totalBytes += lookup.file.size;
        attachments.push({
          filename: lookup.file.downloadFileName,
          path: lookup.file.absolutePath,
          contentType: lookup.file.contentType,
        });
        attached = true;
      }
      guides.push({ name: pocketGuide.pocketGuide, attached });
    }
    const franchiseName = recipient.franchiseName || 'EatFit247';
    await this.emailNotificationService.sendEmailFromTemplate(template, {
      to: recipient.emailId,
      subject: template.subject.replace(/\{\{franchiseName\}\}/g, franchiseName),
      data: {
        franchise: { franchiseName },
        memberName: recipient.memberName,
        guides,
        attachedCount: attachments.length,
      },
      attachments,
    });
  }

  /**
   * The member, if it is in one of the caller's franchises. Empty franchiseIds means unscoped
   * (Super Admin), the same convention as CaslAbilityFactory and AppointmentService; see roadmap 4.4.
   * Out-of-scope members get the same 404 as unknown ones.
   */
  private async findMemberInScope(
    memberId: number,
    user: IAuthUser,
    attributes: string[],
    include?: Includeable[],
  ): Promise<TxnMember> {
    const member = await this.memberRepository.findOne({ where: { memberId }, attributes, include });
    if (!member || (user.franchiseIds.length > 0 && !user.franchiseIds.includes(member.franchiseId))) {
      throw new NotFoundException('Member not found');
    }
    return member;
  }

  private convertToModel(item: any, memberId: number): IMemberPocketGuide {
    const txnMemberPocketGuide = item['txn_member_pocket_guide'];
    return <IMemberPocketGuide>{
      memberId: memberId,
      memberPocketGuideId: txnMemberPocketGuide?.memberPocketGuideId,
      pocketGuideId: item.pocketGuideId,
      pocketGuide: item.pocketGuide,
      isSelected: !!txnMemberPocketGuide?.memberPocketGuideId,
      hasFile: PocketGuideFileUtil.hasFile(item.filePath),
      downloadFileName: PocketGuideFileUtil.downloadFileNameFor(item.pocketGuide, item.filePath),
      createdBy: txnMemberPocketGuide?.createdBy,
      modifiedBy: txnMemberPocketGuide?.modifiedBy,
      createdAt: txnMemberPocketGuide?.createdAt,
      updatedAt: txnMemberPocketGuide?.updatedAt,
      createdByUser: CommonFunctionsUtil.getAdminShortInfo(
        txnMemberPocketGuide.createdByUser,
        'createdByUser',
      ),
      updatedByUser: CommonFunctionsUtil.getAdminShortInfo(
        txnMemberPocketGuide.updatedByUser,
        'updatedByUser',
      ),
    };
  }
}
