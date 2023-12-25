import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ExceptionService } from '../../common/exception.service';
import { Sequelize } from 'sequelize-typescript';
import { TxnAssessment } from '../../../core/database/models/txn-assessment.model';
import { ServerResponseEnum } from 'src/enums/server-response-enum';
import { IServerResponse } from 'src/common-dto/response-interface';
import { MstAdminUser } from 'src/core/database/models/mst-admin-user.model';
import { ADMIN_USER_SHORT_INFO_ATTRIBUTE, IS_DEV } from 'src/constants/config-constants';
import { StringResource } from 'src/enums/string-resource';
import { TxnMemberIssue } from 'src/core/database/models/txn-member-issue.model';
import { BasicSearchDto } from 'src/common-dto/basic-input.dto';
import { MstIssueCategory } from 'src/core/database/models/mst-issue-category.model';
import { MstIssueStatus } from 'src/core/database/models/mst-issue-status.model';
import { TxnMemberIssueResponse } from 'src/core/database/models/txn-member-issue-response.model';
import { MemberIssueResponseDto, MemberIssueStatusDto } from '../dto/member-issue-response.dto';
import { IssueStatusEnum } from 'src/enums/issue-status-enum';

@Injectable()
export class MemberIssuesService {
  constructor(
    @InjectModel(TxnAssessment) private readonly assessmentRepository: typeof TxnAssessment,
    @InjectModel(TxnMemberIssue) private readonly memberIssueRepository: typeof TxnMemberIssue,
    @InjectModel(TxnMemberIssueResponse) private readonly memberIssueResponseRepository: typeof TxnMemberIssueResponse,
    private exceptionService: ExceptionService,
    private sequelize: Sequelize,
  ) {}

  public async findAll(id: number, searchDto: BasicSearchDto): Promise<IServerResponse> {
    let res: IServerResponse;
    try {
      const whereCondition: any = {
        memberId: id,
      };
      if (searchDto.name) {
        whereCondition['name'] = searchDto.name;
      }
      const pageNumber = searchDto.pageNumber;
      const pageSize = searchDto.pageSize;
      let offset = pageNumber === 0 ? 0 : pageNumber * pageSize;

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

      if (!rows || rows.length === 0) {
        res = {
          code: ServerResponseEnum.WARNING,
          message: StringResource.NO_DATA_FOUND,
          data: null,
        };
        return res;
      }

      res = {
        code: ServerResponseEnum.SUCCESS,
        message: StringResource.SUCCESS,
        data: {
          list: rows,
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

  public async update(obj: MemberIssueResponseDto, cIp: string, adminId: number): Promise<IServerResponse> {
    let res: IServerResponse;

    const t = await this.sequelize.transaction();

    try {
      const find = await this.memberIssueResponseRepository.findOne({
        where: {
          memberIssueId: obj.memberIssueId,
        },
      });
      let updatedObj = null;
      if (find) {
        const updateObj = {
          memberIssueId: find.memberIssueId,
          response: obj.response,
          modifiedBy: adminId,
          isLatest: true,
        };

        updatedObj = await this.updateIssueResponseInDB(updateObj);
      } else {
        const updateObj = {
          memberIssueId: obj.memberIssueId,
          response: obj.response,
          modifiedBy: adminId,
          createdBy: adminId,
          isLatest: true,
        };
        updatedObj = await this.createIssueResponseInDB(updateObj);
      }

      if (updatedObj) {
        //Close Issue on Response
        await this.changeStatus(
          obj.memberIssueId,
          { statusId: IssueStatusEnum.CLOSED } as MemberIssueStatusDto,
          adminId,
        );
        await t.commit();

        //TODO: Send Email
        res = {
          code: ServerResponseEnum.SUCCESS,
          message: StringResource.SUCCESS_DATA_UPDATE,
          data: null,
        };
      } else {
        await t.rollback();
        res = {
          code: ServerResponseEnum.ERROR,
          message: StringResource.SOMETHING_WENT_WRONG,
          data: null,
        };
      }
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

  public async changeStatus(
    memberIssueId: number,
    obj: MemberIssueStatusDto,
    adminId: number,
  ): Promise<IServerResponse> {
    let res: IServerResponse;
    try {
      const find = await this.memberIssueRepository.findOne({
        where: {
          memberIssueId: memberIssueId,
        },
      });
      if (find) {
        const updateObj = {
          issueStatusId: obj.statusId,
          modifiedBy: adminId,
        };
        const updatedObj = await this.updateIssueStatusInDB(memberIssueId, updateObj);
        if (updatedObj) {
          res = {
            code: ServerResponseEnum.SUCCESS,
            message: StringResource.SUCCESS_DATA_STATUS_CHANGE,
            data: null,
          };
        } else {
          res = {
            code: ServerResponseEnum.ERROR,
            message: StringResource.SOMETHING_WENT_WRONG,
            data: null,
          };
        }
      } else {
        res = {
          code: ServerResponseEnum.WARNING,
          message: StringResource.NO_DATA_FOUND,
          data: null,
        };
      }
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

  public async deleteIssue(memberIssueId: number, adminId: number): Promise<IServerResponse> {
    let res: IServerResponse;
    const transaction = await this.sequelize.transaction();
    try {
      const deleteObject = await this.memberIssueResponseRepository.destroy({
        where: {
          memberIssueId: memberIssueId,
        },
      });
      const find = await this.memberIssueRepository.findOne({
        where: {
          memberIssueId: memberIssueId,
        },
      });
      if (find) {
        const deleteIssueObject = await this.memberIssueRepository.destroy({
          where: {
            memberIssueId: memberIssueId,
          },
        });
        if (deleteIssueObject) {
          transaction.commit();
          res = {
            code: ServerResponseEnum.SUCCESS,
            message: StringResource.SUCCESS_DATA_STATUS_CHANGE,
            data: null,
          };
        } else {
          transaction.rollback();
          res = {
            code: ServerResponseEnum.ERROR,
            message: StringResource.SOMETHING_WENT_WRONG,
            data: null,
          };
        }
      } else {
        transaction.rollback();
        res = {
          code: ServerResponseEnum.WARNING,
          message: StringResource.NO_DATA_FOUND,
          data: null,
        };
      }
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

  private async createInDB(obj: any) {
    return await this.assessmentRepository
      .create(obj)
      .then((result) => {
        return result;
      })
      .catch((e) => {
        throw e;
      });
  }

  private async updateInDB(id: number, obj: any) {
    return await this.assessmentRepository
      .update(obj, { where: { memberId: id } })
      .then((result) => {
        return result;
      })
      .catch((e) => {
        throw e;
      });
  }

  private async findOneById(memberId: number): Promise<TxnAssessment | null> {
    return await this.assessmentRepository.findOne<TxnAssessment>({
      where: { memberId: memberId },
      raw: true,
      nest: true,
    });
  }

  private async createIssueResponseInDB(obj: any) {
    return await this.memberIssueResponseRepository
      .create(obj)
      .then((result) => {
        return result;
      })
      .catch((e) => {
        throw e;
      });
  }

  private async updateIssueResponseInDB(obj: any) {
    return await this.memberIssueResponseRepository
      .update(obj, { where: { memberIssueId: obj.memberIssueId } })
      .then((result) => {
        return result;
      })
      .catch((e) => {
        throw e;
      });
  }

  private async updateIssueStatusInDB(id: number, obj: any) {
    return await this.memberIssueRepository
      .update(obj, { where: { memberIssueId: id } })
      .then((result) => {
        return result;
      })
      .catch((e) => {
        throw e;
      });
  }
}
