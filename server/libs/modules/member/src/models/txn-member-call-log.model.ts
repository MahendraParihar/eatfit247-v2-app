import { BelongsTo, Column, CreatedAt, DataType, Model, Scopes, Table, UpdatedAt } from 'sequelize-typescript';
import {
  MstAdminUser,
  getCreatedByUserInclude,
  getUpdatedByUserInclude,
  MstCallType,
  MstCallPurpose,
  MstCallLogStatus,
} from '@server/common';
import { TxnMember } from './txn-member.model';
import { IGoogleCalendarEvent, InputLengthEnum, IZoomEvent } from '@eatfit247-shared-lib';

@Table({
  freezeTableName: true,
  modelName: 'txn_member_call_logs',
  schema: 'public',
  tableName: 'txn_member_call_logs',
  indexes: [
    {
      unique: false,
      fields: ['member_id'],
      name: 'ix_uq_txn_member_call_log_member_id',
    },
    {
      unique: false,
      fields: ['call_log_status_id'],
      name: 'ix_uq_txn_member_call_log_call_log_status_id',
    },
  ],
})
@Scopes(() => ({
  list: {
    include: [
      getCreatedByUserInclude(false),
      getUpdatedByUserInclude(false),
      {
        model: TxnMember,
        as: 'member',
        required: false,
        attributes: ['memberId', 'firstName', 'lastName', 'emailId', 'contactNumber'],
      },
      {
        model: MstCallType,
        as: 'callType',
        required: false,
        attributes: ['callTypeId', 'callType'],
      },
      {
        model: MstCallPurpose,
        as: 'callPurpose',
        required: false,
        attributes: ['callPurposeId', 'callPurpose'],
      },
      {
        model: MstCallLogStatus,
        as: 'callLogStatus',
        required: false,
        attributes: ['callLogStatusId', 'callLogStatus'],
      },
      {
        model: MstAdminUser,
        as: 'nutritionist',
        required: false,
        attributes: ['adminId', 'firstName', 'lastName', 'emailId'],
      },
    ],
  },
  details: {
    include: [
      getCreatedByUserInclude(false),
      getUpdatedByUserInclude(false),
      {
        model: MstCallType,
        as: 'callType',
        required: false,
        attributes: ['callTypeId', 'callType', 'imagePath'],
      },
      {
        model: MstCallPurpose,
        as: 'callPurpose',
        required: false,
        attributes: ['callPurposeId', 'callPurpose', 'imagePath'],
      },
      {
        model: MstCallLogStatus,
        as: 'callLogStatus',
        required: false,
        attributes: ['callLogStatusId', 'callLogStatus'],
      },
      {
        model: MstAdminUser,
        as: 'nutritionist',
        required: false,
        attributes: ['adminId', 'firstName', 'lastName', 'emailId'],
      },
    ],
  },
}))
export class TxnMemberCallLog extends Model<TxnMemberCallLog> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'member_call_log_id',
    autoIncrement: true,
  })
  declare memberCallLogId: number;
  @Column({
    allowNull: false,
    field: 'member_id',
    type: DataType.INTEGER,
  })
  declare memberId: number;
  @Column({
    allowNull: false,
    field: 'start_time',
    type: DataType.DATE,
  })
  declare startTime: Date;
  @Column({
    allowNull: false,
    field: 'end_time',
    type: DataType.DATE,
  })
  declare endTime: Date;
  @Column({
    allowNull: false,
    field: 'call_type_id',
    type: DataType.INTEGER,
  })
  declare callTypeId: number;
  @Column({
    allowNull: false,
    field: 'call_purpose_id',
    type: DataType.INTEGER,
  })
  declare callPurposeId: number;
  @Column({
    allowNull: false,
    field: 'call_log_status_id',
    type: DataType.INTEGER,
  })
  declare callLogStatusId: number;
  @Column({
    allowNull: true,
    field: 'detail',
    type: DataType.JSONB,
  })
  declare detail: { google: IGoogleCalendarEvent; zoom: IZoomEvent };
  @Column({
    allowNull: true,
    field: 'conversion_history',
    type: DataType.STRING(InputLengthEnum.CHAR_250),
  })
  declare conversionHistory: string;
  @Column({
    allowNull: false,
    defaultValue: false,
    field: 'is_mail_success',
    type: DataType.BOOLEAN,
  })
  declare isMailSuccess: boolean;
  @Column({
    allowNull: true,
    field: 'nutrinist_id',
    type: DataType.INTEGER,
  })
  declare nutritionistId: number;
  @Column({
    allowNull: true,
    field: 'meeting_link',
    type: DataType.TEXT,
  })
  declare meetingLink: string;
  @Column({
    allowNull: true,
    field: 'calendar_event_id',
    type: DataType.TEXT,
  })
  declare calendarEventId: string;
  @Column({
    allowNull: false,
    defaultValue: true,
    field: 'is_system_generated',
    type: DataType.BOOLEAN,
  })
  declare isSystemGenerated: boolean;
  @Column({
    allowNull: false,
    defaultValue: true,
    field: 'active',
    type: DataType.BOOLEAN,
  })
  declare active: boolean;
  @Column({
    allowNull: true,
    field: 'created_by',
    type: DataType.INTEGER,
  })
  declare createdBy: number;
  @CreatedAt
  @Column({
    allowNull: false,
    field: 'created_at',
  })
  declare createdAt: Date;
  @Column({
    allowNull: true,
    field: 'modified_by',
    type: DataType.INTEGER,
  })
  declare modifiedBy: number;
  @UpdatedAt
  @Column({
    allowNull: false,
    field: 'updated_at',
  })
  declare updatedAt: Date;
  @Column({
    allowNull: false,
    field: 'created_ip',
    type: DataType.STRING(InputLengthEnum.IP),
  })
  declare createdIp: string;
  @Column({
    allowNull: false,
    field: 'modified_ip',
    type: DataType.STRING(InputLengthEnum.IP),
  })
  declare modifiedIp: string;
  @BelongsTo(() => TxnMember, {
    foreignKey: 'memberId',
    targetKey: 'memberId',
    as: 'member',
  })
  declare member: TxnMember;
  @BelongsTo(() => MstCallType, {
    foreignKey: 'callTypeId',
    targetKey: 'callTypeId',
    as: 'callType',
  })
  declare callType: MstCallType;
  @BelongsTo(() => MstCallPurpose, {
    foreignKey: 'callPurposeId',
    targetKey: 'callPurposeId',
    as: 'callPurpose',
  })
  declare callPurpose: MstCallPurpose;
  @BelongsTo(() => MstCallLogStatus, {
    foreignKey: 'callLogStatusId',
    targetKey: 'callLogStatusId',
    as: 'callLogStatus',
  })
  declare callLogStatus: MstCallLogStatus;
  @BelongsTo(() => MstAdminUser, {
    as: 'createdByUser',
    foreignKey: 'createdBy',
    targetKey: 'adminId',
  })
  declare createdByUser: MstAdminUser;
  @BelongsTo(() => MstAdminUser, {
    as: 'updatedByUser',
    foreignKey: 'modifiedBy',
    targetKey: 'adminId',
  })
  declare updatedByUser: MstAdminUser;
  @BelongsTo(() => MstAdminUser, {
    as: 'nutritionist',
    foreignKey: 'nutritionistId',
    targetKey: 'adminId',
  })
  declare nutritionist: MstAdminUser;
}
