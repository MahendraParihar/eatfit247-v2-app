import { BelongsTo, Column, CreatedAt, DataType, Model, Scopes, Table, UpdatedAt } from 'sequelize-typescript';
import {
  MstAdminUser,
  getCreatedByUserInclude,
  getUpdatedByUserInclude,
} from '@server_1/core';
import { TxnMemberDietPlan } from './txn-member-diet-plan.model';
import { InputLengthEnum } from '@eatfit247-shared-lib';

@Table({
  freezeTableName: true,
  modelName: 'txn_member_diet_details',
  schema: 'public',
  tableName: 'txn_member_diet_details',
  indexes: [
    {
      unique: false,
      fields: ['member_diet_plan_id'],
      name: 'txn_member_diet_details_member_index',
    },
    {
      unique: true,
      fields: ['member_diet_plan_id', 'cycle_no', 'day_no'],
      name: 'ix_uk_txn_member_diet_details_dp_cy_dy',
    },
  ],
})
@Scopes(() => ({
  list: {
    include: [
      getCreatedByUserInclude(false),
      getUpdatedByUserInclude(false),
      {
        model: TxnMemberDietPlan,
        as: 'memberDietPlan',
        required: false,
        attributes: ['memberDietPlanId', 'memberId', 'noOfCycle', 'daysInCycle', 'currentCycleNo', 'currentDayNo'],
      },
    ],
  },
  details: {
    include: [
      getCreatedByUserInclude(false),
      getUpdatedByUserInclude(false),
      {
        model: TxnMemberDietPlan,
        as: 'memberDietPlan',
        required: false,
      },
    ],
  },
}))
export class TxnMemberDietDetail extends Model<TxnMemberDietDetail> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'member_diet_detail_id',
    autoIncrement: true,
  })
  declare memberDietDetailId: number;

  @Column({
    allowNull: false,
    field: 'member_diet_plan_id',
    type: DataType.INTEGER,
  })
  declare memberDietPlanId: number;

  @Column({
    allowNull: false,
    field: 'cycle_no',
    type: DataType.INTEGER,
  })
  declare cycleNo: number;

  @Column({
    allowNull: true,
    field: 'day_no',
    type: DataType.INTEGER,
  })
  declare dayNo: number;

  @Column({
    allowNull: false,
    field: 'diet_plan',
    type: DataType.JSONB,
  })
  declare dietPlan: any;

  @Column({
    allowNull: false,
    field: 'start_date',
    type: DataType.DATEONLY,
  })
  declare startDate: Date;

  @Column({
    allowNull: false,
    field: 'end_date',
    type: DataType.DATEONLY,
  })
  declare endDate: Date;

  @Column({
    allowNull: false,
    field: 'type',
    type: DataType.ENUM('CYCLE', 'DAY'),
  })
  declare type: 'CYCLE' | 'DAY';

  @BelongsTo(() => TxnMemberDietPlan, {
    foreignKey: 'memberDietPlanId',
    targetKey: 'memberDietPlanId',
    as: 'memberDietPlan',
  })
  declare memberDietPlan: TxnMemberDietPlan;

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

