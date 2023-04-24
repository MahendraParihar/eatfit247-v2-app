import { BelongsTo, Column, CreatedAt, DataType, Model, Table, UpdatedAt } from 'sequelize-typescript';
import { MstAdminUser } from './mst-admin-user.model';
import { TxnMember } from './txn-member.model';
import { MstCallType } from './mst-call-type.model';
import { MstCallPurpose } from './mst-call-purpose.model';
import { MstCallLogStatus } from './mst-call-log-status.model';

@Table({
  modelName: 'txn_member_call_log',
  schema: 'public',
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
export class TxnMemberCallLog extends Model<TxnMemberCallLog> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'member_call_log_id',
    autoIncrement: true,
  })
  memberCallLogId: number;

  @BelongsTo(() => TxnMember, {
    foreignKey: 'memberId',
    targetKey: 'memberId',
    as: 'MemberCallLog',
  })
  @Column({
    allowNull: false,
    field: 'member_id',
    type: DataType.INTEGER,
  })
  memberId: number;

  @Column({
    allowNull: false,
    field: 'date',
    type: DataType.DATEONLY,
  })
  date: Date;

  @Column({
    allowNull: false,
    field: 'start_time',
    type: DataType.TIME,
  })
  startTime: Date;

  @Column({
    allowNull: false,
    field: 'end_time',
    type: DataType.TIME,
  })
  endTime: Date;

  @BelongsTo(() => MstCallType, {
    foreignKey: 'callTypeId',
    targetKey: 'callTypeId',
    as: 'MemberCallLogType',
  })
  @Column({
    allowNull: false,
    field: 'call_type_id',
    type: DataType.INTEGER,
  })
  callTypeId: number;

  @BelongsTo(() => MstCallPurpose, {
    foreignKey: 'callPurposeId',
    targetKey: 'callPurposeId',
    as: 'MemberCallLogPurpose',
  })
  @Column({
    allowNull: false,
    field: 'call_purpose_id',
    type: DataType.INTEGER,
  })
  callPurposeId: number;

  @BelongsTo(() => MstCallLogStatus, {
    foreignKey: 'callLogStatusId',
    targetKey: 'callLogStatusId',
    as: 'MemberCallLogStatus',
  })
  @Column({
    allowNull: false,
    field: 'call_log_status_id',
    type: DataType.INTEGER,
  })
  callLogStatusId: number;

  @Column({
    allowNull: true,
    field: 'detail',
    type: DataType.STRING(250),
  })
  detail: string;

  @Column({
    allowNull: true,
    field: 'conversion_history',
    type: DataType.STRING(250),
  })
  conversionHistory: string;

  @Column({
    allowNull: false,
    defaultValue: false,
    field: 'is_mail_success',
  })
  isMailSuccess: boolean;

  @Column({
    allowNull: false,
    defaultValue: true,
    field: 'active',
  })
  active: boolean;

  @BelongsTo(() => MstAdminUser, {
    foreignKey: 'createdBy',
    targetKey: 'adminId',
    as: 'CreatedBy',
  })
  @Column({
    allowNull: true,
    field: 'created_by',
  })
  createdBy: number;

  @CreatedAt
  @Column({
    allowNull: false,
    field: 'created_at',
  })
  createdAt: Date;

  @BelongsTo(() => MstAdminUser, {
    foreignKey: 'modifiedBy',
    targetKey: 'adminId',
    as: 'ModifiedBy',
  })
  @Column({
    allowNull: true,
    field: 'modified_by',
  })
  modifiedBy: number;

  @UpdatedAt
  @Column({
    allowNull: false,
    field: 'updated_at',
  })
  updatedAt: Date;

  @Column({
    allowNull: false,
    field: 'created_ip',
  })
  createdIp: string;

  @Column({
    allowNull: false,
    field: 'modified_ip',
  })
  modifiedIp: string;
}
