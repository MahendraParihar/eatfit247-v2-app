import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { TxnAssessment } from '../../../core/database/models/txn-assessment.model';
import { MstAdminUser } from 'src/core/database/models/mst-admin-user.model';
import { ADMIN_USER_SHORT_INFO_ATTRIBUTE } from 'src/constants/config-constants';
import { StringResource, ITableList, IBasicSearch } from 'shared-lib';
import { TxnMemberIssue } from 'src/core/database/models/txn-member-issue.model';
import { BasicSearchDto } from 'src/common-dto/basic-input.dto';
import { MstIssueCategory } from 'src/core/database/models/mst-issue-category.model';
import { MstIssueStatus } from 'src/core/database/models/mst-issue-status.model';
import { TxnMemberIssueResponse } from 'src/core/database/models/txn-member-issue-response.model';
import { MemberIssueResponseDto, MemberIssueStatusDto } from '../dto/member-issue-response.dto';
import { IssueStatusEnum } from 'shared-lib';

@Injectable()
export class MemberIssuesService {
  constructor(
    @InjectModel(TxnAssessment) private readonly assessmentRepository: typeof TxnAssessment,
    @InjectModel(TxnMemberIssue) private readonly memberIssueRepository: typeof TxnMemberIssue,
    @InjectModel(TxnMemberIssueResponse) private readonly memberIssueResponseRepository: typeof TxnMemberIssueResponse,
    private sequelize: Sequelize,
  ) {}

  public async findAll(id: number, searchDto: IBasicSearch): Promise<ITableList<any>> {
    const whereCondition: any = {
      memberId: id,
    };
    if (searchDto.name) {
      whereCondition['name'] = searchDto.name;
    }
    const pageNumber = searchDto.pageNumber;
    const pageSize = searchDto.pageSize;
    const offset = pageNumber === 0 ? 0 : pageNumber * pageSize;

    TxnMemberIssue.belongsTo(TxnMemberIssueResponse, {
      targetKey: 'memberIssueId',
      foreignKey: 'memberIssueId',
    });
    const { rows, count } = await this.memberIssueRepository.findAndCountAll<TxnMemberIssue>({
      include: [
        {
          model: MstIssueCategory,
          required: true,
          as: 'MemberIssueCategory',
          attributes: ['issueCategory'],
        },
        {
          model: MstIssueStatus,
          required: true,
          as: 'MemberIssueStatus',
          attributes: ['issueStatus'],
        },
        {
          model: MstAdminUser,
          required: false,
          as: 'CreatedBy',
          attributes: ADMIN_USER_SHORT_INFO_ATTRIBUTE,
        },
        {
          model: TxnMemberIssueResponse,
          required: false,
          attributes: ['response', 'memberIssueResponseId', 'updatedAt'],
          include: [
            {
              model: MstAdminUser,
              required: false,
              as: 'ModifiedBy',
              attributes: ADMIN_USER_SHORT_INFO_ATTRIBUTE,
            },
          ],
        },
      ],
      where: whereCondition,
      order: [],
      offset: offset,
      limit: pageSize,
      raw: true,
      nest: true,
    });

    return <ITableList<any>>{
      data: rows,
      count: count,
    };
  }

  public async update(obj: MemberIssueResponseDto, cIp: string, adminId: number): Promise<void> {
    const t = await this.sequelize.transaction();
    try {
      const find = await this.memberIssueResponseRepository.findOne({
        where: {
          memberIssueId: obj.memberIssueId,
        },
      });
      if (find) {
        const updateObj = {
          memberIssueId: find.memberIssueId,
          response: obj.response,
          modifiedBy: adminId,
          isLatest: true,
        };
        await this.updateIssueResponseInDB(updateObj);
      } else {
        const updateObj = {
          memberIssueId: obj.memberIssueId,
          response: obj.response,
          modifiedBy: adminId,
          createdBy: adminId,
          isLatest: true,
        };
        await this.createIssueResponseInDB(updateObj);
      }
      //Close Issue on Response
      await this.changeStatus(
        obj.memberIssueId,
        { statusId: IssueStatusEnum.CLOSED } as MemberIssueStatusDto,
        adminId,
      );
      await t.commit();
      //TODO: Send Email
    } catch (e) {
      await t.rollback();
      throw e;
    }
  }

  public async changeStatus(
    memberIssueId: number,
    obj: MemberIssueStatusDto,
    adminId: number,
  ): Promise<void> {
    const find = await this.memberIssueRepository.findOne({
      where: {
        memberIssueId: memberIssueId,
      },
    });
    if (!find) {
      throw new NotFoundException(StringResource.NO_DATA_FOUND);
    }
    const updateObj = {
      issueStatusId: obj.statusId,
      modifiedBy: adminId,
    };
    await this.updateInDB(memberIssueId, updateObj);
  }

  public async deleteIssue(memberIssueId: number, adminId: number): Promise<void> {
    const transaction = await this.sequelize.transaction();
    try {
      await this.memberIssueResponseRepository.destroy({
        where: {
          memberIssueId: memberIssueId,
        },
      });
      const find = await this.memberIssueRepository.findOne({
        where: {
          memberIssueId: memberIssueId,
        },
      });
      if (!find) {
        await transaction.rollback();
        throw new NotFoundException(StringResource.NO_DATA_FOUND);
      }
      await this.memberIssueRepository.destroy({
        where: {
          memberIssueId: memberIssueId,
        },
      });
      await transaction.commit();
    } catch (e) {
      await transaction.rollback();
      throw e;
    }
  }

  private async createInDB(obj: any) {
    return await this.assessmentRepository.create(obj);
  }

  private async updateInDB(id: number, obj: any) {
    return await this.assessmentRepository.update(obj, { where: { memberId: id } });
  }

  private async findOneById(memberId: number): Promise<TxnAssessment | null> {
    return await this.assessmentRepository.findOne<TxnAssessment>({
      where: { memberId: memberId },
      raw: true,
      nest: true,
    });
  }

  private async createIssueResponseInDB(obj: any) {
    return await this.memberIssueResponseRepository.create(obj);
  }

  private async updateIssueResponseInDB(obj: any) {
    return await this.memberIssueResponseRepository.update(obj, { where: { memberIssueId: obj.memberIssueId } });
  }

  private async updateIssueStatusInDB(id: number, obj: any) {
    return await this.memberIssueRepository.update(obj, { where: { memberIssueId: id } });
  }
}
