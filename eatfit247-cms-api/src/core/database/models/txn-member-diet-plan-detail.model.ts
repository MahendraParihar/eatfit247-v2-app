import { BelongsTo, Column, CreatedAt, DataType, Model, Table, UpdatedAt } from 'sequelize-typescript';
import { MstAdminUser } from './mst-admin-user.model';
import { TxnMemberDietPlan } from './txn-member-diet-plan.model';

@Table({
  modelName: 'txn_member_diet_detail',
  schema: 'public',
  indexes: [
    {
      unique: false,
      fields: ['member_diet_plan_id'],
      name: 'ix_txn_member_diet_detail_diet_id',
    },
    {
      unique: true,
      fields: ['member_diet_plan_id', 'cycle_no', 'day_no'],
      name: 'ix_uk_txn_member_diet_detail_dp_cy_dy',
    },
  ],
})
export class TxnMemberDietPlanDetail extends Model<TxnMemberDietPlanDetail> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'member_diet_detail_id',
    autoIncrement: true,
  })
  memberDietPlanDetailId: number;

  @BelongsTo(() => TxnMemberDietPlan, {
    foreignKey: 'memberDietPlanId',
    targetKey: 'memberDietPlanId',
    as: 'MemberDietDetailDietPlan',
  })
  @Column({
    allowNull: false,
    field: 'member_diet_plan_id',
    type: DataType.INTEGER,
  })
  memberDietPlanId: number;

  @Column({
    allowNull: false,
    field: 'cycle_no',
    type: DataType.INTEGER,
  })
  cycleNo: number;

  @Column({
    allowNull: true,
    field: 'day_no',
    type: DataType.INTEGER,
  })
  dayNo: number;

  @Column({
    allowNull: false,
    field: 'diet_plan',
    defaultValue: null,
    type: DataType.JSONB,
  })
  dietPlan: JSON;

  @Column({
    allowNull: true,
    field: 'start_date',
    defaultValue: null,
    type: DataType.DATEONLY,
  })
  startDate: Date;

  @Column({
    allowNull: true,
    field: 'end_date',
    type: DataType.DATEONLY,
  })
  endDate: Date;

  @Column({
    allowNull: false,
    field: 'type',
    type: DataType.ENUM('CYCLE', 'DAY'),
  })
  type: string;

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
