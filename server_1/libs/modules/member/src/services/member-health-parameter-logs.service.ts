import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { TxnMember, TxnMemberHealthParameter, TxnMemberHealthParameterLog } from '../models';
import { CommonFunctionsUtil } from '@server_1/core';
import { MstHealthParameter, MstHealthParameterUnit } from '@server_1/modules/assessment';
import {
  IHealthParameterMaster,
  IManageMemberHealthParameterLog,
  IMemberHealthParameter,
  IMemberHealthParameterLog,
} from '@eatfit247-shared-lib';

@Injectable()
export class MemberHealthParameterLogsService {
  constructor(
    @InjectModel(TxnMemberHealthParameterLog)
    private readonly memberHealthParameterLogRepository: typeof TxnMemberHealthParameterLog,
    @InjectModel(TxnMember) private readonly memberRepository: typeof TxnMember,
    @InjectModel(TxnMemberHealthParameter)
    private readonly memberHealthParameterRepository: typeof TxnMemberHealthParameter,
    @InjectModel(MstHealthParameterUnit)
    private readonly healthParameterUnit: typeof MstHealthParameterUnit,
    @InjectModel(MstHealthParameter) private readonly healthParameter: typeof MstHealthParameter,
    private readonly sequelize: Sequelize,
  ) {}

  public async getMasterData(): Promise<IHealthParameterMaster> {
    const [healthParameterUnits, healthParameters] = await Promise.all([
      this.healthParameterUnit.findAll({ where: { active: true } }),
      this.healthParameter.findAll({ where: { active: true } }),
    ]);
    return <IHealthParameterMaster>{
      healthParameterUnits: healthParameterUnits.map((p: MstHealthParameterUnit) => {
        return {
          id: p.healthParameterUnitId,
          label: p.healthParameterUnit,
        };
      }),
      healthParameters: healthParameters.map((p: MstHealthParameter) => {
        return {
          id: p.healthParameterId,
          label: p.healthParameter,
        };
      }),
    };
  }

  /**
   * Get a single health parameter log by ID
   * @param memberId - Member ID
   * @param logId - Health parameter log ID
   * @returns Health parameter log with nested health parameters
   */
  public async findById(memberId: number, logId: number): Promise<IMemberHealthParameterLog> {
    // Verify member exists
    const member = await this.memberRepository.findOne({
      where: { memberId },
    });
    if (!member) {
      throw new NotFoundException('Member not found');
    }

    // Fetch health parameter log with nested health parameters
    const record = await this.memberHealthParameterLogRepository.scope('details').findOne({
      where: { memberHealthParameterLogId: logId, memberId },
      raw: false,
      nest: true,
    });

    if (!record) {
      throw new NotFoundException('Health parameter log not found');
    }

    return this.convertToModel(record);
  }

  /**
   * Get all health parameter logs for a member
   * @param memberId - Member ID
   * @returns Array of member health parameter logs with nested health parameters
   */
  public async findByMemberId(memberId: number): Promise<IMemberHealthParameterLog[]> {
    // Verify member exists
    const member = await this.memberRepository.findOne({
      where: { memberId },
    });
    if (!member) {
      throw new NotFoundException('Member not found');
    }
    // Fetch health parameter logs with nested health parameters using Sequelize joins
    const records = await this.memberHealthParameterLogRepository.scope('details').findAll({
      where: { memberId },
      order: [['logDate', 'DESC']],
      raw: false,
      nest: true,
    });
    return records.map((log) => this.convertToModel(log));
  }

  private convertToModel(item: TxnMemberHealthParameterLog): IMemberHealthParameterLog {
    return {
      memberHealthParameterLogId: item.memberHealthParameterLogId,
      memberId: item.memberId,
      logDate: item.logDate,
      healthParameters: (item.healthParameters || []).map((param: TxnMemberHealthParameter) =>
        this.convertHealthParameterToModel(param),
      ),
      active: item.active,
      createdBy: item.createdBy,
      modifiedBy: item.modifiedBy,
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

  private convertHealthParameterToModel(item: any): IMemberHealthParameter {
    return {
      memberHealthParameterLogId: item.memberHealthParameterLogId,
      healthParameterId: item.healthParameterId,
      healthParameter: item.healthParameter?.healthParameter || '',
      value: item.value,
      healthParameterUnitId: item.healthParameterUnitId || 0,
      healthParameterUnit: item.healthParameterUnit?.healthParameterUnit || '',
    };
  }

  /**
   * Create or update health parameter log for a member
   * @param memberId - Member ID
   * @param obj - Health parameter log data
   * @param requestedIp - Request IP
   * @param adminId - Admin user ID
   */
  public async createOrUpdate(
    memberId: number,
    obj: IManageMemberHealthParameterLog,
    requestedIp: string,
    adminId: number,
  ): Promise<IMemberHealthParameterLog> {
    // Verify member exists
    const member = await this.memberRepository.findOne({
      where: { memberId },
    });
    if (!member) {
      throw new NotFoundException('Member not found');
    }
    const t = await this.sequelize.transaction();
    try {
      let logRecord: TxnMemberHealthParameterLog;
      if (obj.memberHealthParameterLogId) {
        // Update existing log
        logRecord = await this.memberHealthParameterLogRepository.findOne({
          where: { memberHealthParameterLogId: obj.memberHealthParameterLogId, memberId },
          transaction: t,
        });
        if (!logRecord) {
          throw new NotFoundException('Health parameter log not found');
        }
        logRecord.logDate = obj.logDate;
        logRecord.modifiedBy = adminId;
        logRecord.modifiedIp = requestedIp;
        await logRecord.save({ transaction: t });
        // Delete existing health parameters
        await this.memberHealthParameterRepository.destroy({
          where: { memberHealthParameterLogId: obj.memberHealthParameterLogId },
          transaction: t,
        });
      } else {
        // Create new log
        logRecord = await this.memberHealthParameterLogRepository.create(
          {
            memberId,
            logDate: obj.logDate,
            active: true,
            createdBy: adminId,
            modifiedBy: adminId,
            createdIp: requestedIp,
            modifiedIp: requestedIp,
          },
          { transaction: t },
        );
      }
      // Create health parameters
      if (obj.healthParameters && obj.healthParameters.length > 0) {
        await this.memberHealthParameterRepository.bulkCreate(
          obj.healthParameters.map((param) => ({
            memberHealthParameterLogId: logRecord.memberHealthParameterLogId,
            healthParameterId: param.healthParameterId,
            value: param.value,
            healthParameterUnitId: param.healthParameterUnitId,
          })),
          { transaction: t },
        );
      }
      await t.commit();
      // Fetch the created/updated record with relationships
      const updatedRecord = await this.memberHealthParameterLogRepository.scope('details').findOne({
        where: { memberHealthParameterLogId: logRecord.memberHealthParameterLogId },
        raw: false,
        nest: true,
      });
      return this.convertToModel(updatedRecord!);
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  /**
   * Delete health parameter log for a member
   * @param memberId - Member ID
   * @param logId - Health parameter log ID
   * @param requestedIp - Request IP
   * @param adminId - Admin user ID
   */
  public async delete(memberId: number, logId: number, requestedIp: string, adminId: number): Promise<void> {
    // Verify member exists
    const member = await this.memberRepository.findOne({
      where: { memberId },
    });
    if (!member) {
      throw new NotFoundException('Member not found');
    }

    // Verify log exists
    const logRecord = await this.memberHealthParameterLogRepository.findOne({
      where: { memberHealthParameterLogId: logId, memberId },
    });
    if (!logRecord) {
      throw new NotFoundException('Health parameter log not found');
    }

    const t = await this.sequelize.transaction();
    try {
      // Delete health parameters first (foreign key constraint)
      await this.memberHealthParameterRepository.destroy({
        where: { memberHealthParameterLogId: logId },
        transaction: t,
      });

      // Delete the log record
      await logRecord.destroy({ transaction: t });

      await t.commit();
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }
}
