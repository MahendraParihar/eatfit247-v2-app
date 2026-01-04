import { BelongsTo, Column, CreatedAt, DataType, Model, Scopes, Table, UpdatedAt } from 'sequelize-typescript';
import { getCreatedByUserInclude, getUpdatedByUserInclude, MstAdminUser } from '@server_1/core';
import { TxnMember } from './txn-member.model';
import { TxnMemberPayment } from './txn-member-payment.model';
import { InputLengthEnum } from '@eatfit247-shared-lib';

@Table({
  freezeTableName: true,
  modelName: 'txn_member_diet_plans',
  schema: 'public',
  tableName: 'txn_member_diet_plans',
  indexes: [
    {
      unique: false,
      fields: ['member_id'],
      name: 'ix_txn_member_diets_member_id',
    },
    {
      unique: true,
      fields: ['member_id', 'member_payment_id'],
      name: 'ix_uk_txn_member_diet_member_payment_id',
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
        model: TxnMemberPayment,
        as: 'memberPayment',
        required: false,
        attributes: ['memberPaymentId', 'invoiceId', 'paymentDate', 'paymentStatusId'],
      },
    ],
  },
  details: {
    include: [
      getCreatedByUserInclude(false),
      getUpdatedByUserInclude(false),
      {
        model: TxnMember,
        as: 'member',
        required: false,
      },
      {
        model: TxnMemberPayment,
        as: 'memberPayment',
        required: false,
      },
    ],
  },
}))
export class TxnMemberDietPlan extends Model<TxnMemberDietPlan> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'member_diet_plan_id',
    autoIncrement: true,
  })
  declare memberDietPlanId: number;

  @Column({
    allowNull: false,
    field: 'member_id',
    type: DataType.INTEGER,
  })
  declare memberId: number;

  @Column({
    allowNull: false,
    field: 'member_payment_id',
    type: DataType.INTEGER,
  })
  declare memberPaymentId: number;

  @Column({
    allowNull: false,
    field: 'no_of_cycle',
    type: DataType.INTEGER,
  })
  declare noOfCycle: number;

  @Column({
    allowNull: false,
    field: 'days_in_cycle',
    type: DataType.INTEGER,
  })
  declare daysInCycle: number;

  @Column({
    allowNull: true,
    field: 'current_cycle_no',
    type: DataType.INTEGER,
  })
  declare currentCycleNo: number;

  @Column({
    allowNull: true,
    field: 'current_day_no',
    type: DataType.INTEGER,
  })
  declare currentDayNo: number;

  @Column({
    allowNull: true,
    field: 'start_date',
    type: DataType.DATEONLY,
  })
  declare startDate: Date;

  @Column({
    allowNull: true,
    field: 'end_date',
    type: DataType.DATEONLY,
  })
  declare endDate: Date;

  @Column({
    allowNull: false,
    defaultValue: false,
    field: 'is_completed',
    type: DataType.BOOLEAN,
  })
  declare isCompleted: boolean;

  @Column({
    allowNull: false,
    defaultValue: true,
    field: 'active',
    type: DataType.BOOLEAN,
  })
  declare active: boolean;

  @BelongsTo(() => TxnMember, {
    foreignKey: 'memberId',
    targetKey: 'memberId',
    as: 'member',
  })
  declare member: TxnMember;

  @BelongsTo(() => TxnMemberPayment, {
    foreignKey: 'memberPaymentId',
    targetKey: 'memberPaymentId',
    as: 'memberPayment',
  })
  declare memberPayment: TxnMemberPayment;

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
}

