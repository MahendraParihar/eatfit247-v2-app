import { BelongsTo, Column, CreatedAt, DataType, Model, Table, UpdatedAt } from 'sequelize-typescript';
import { MstAdminUser } from './mst-admin-user.model';
import { TxnMember } from './txn-member.model';
import { TxnMemberPayment } from './txn-member-payment.model';

@Table({
  modelName: 'txn_member_diet_plan',
  schema: 'public',
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
export class TxnMemberDietPlan extends Model<TxnMemberDietPlan> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'member_diet_plan_id',
    autoIncrement: true,
  })
  memberDietPlanId: number;

  @BelongsTo(() => TxnMember, {
    foreignKey: 'memberId',
    targetKey: 'memberId',
    as: 'MemberDietPlan',
  })
  @Column({
    allowNull: false,
    field: 'member_id',
    type: DataType.INTEGER,
  })
  memberId: number;

  @BelongsTo(() => TxnMemberPayment, {
    foreignKey: 'memberPaymentId',
    targetKey: 'memberPaymentId',
    as: 'MemberPayment',
  })
  @Column({
    allowNull: false,
    field: 'member_payment_id',
    type: DataType.INTEGER,
  })
  memberPaymentId: number;

  @Column({
    allowNull: false,
    field: 'no_of_cycle',
    type: DataType.INTEGER,
  })
  noOfCycle: number;

  @Column({
    allowNull: false,
    field: 'days_in_cycle',
    type: DataType.INTEGER,
  })
  noOfDaysInCycle: number;

  @Column({
    allowNull: true,
    field: 'current_cycle_no',
    defaultValue: null,
    type: DataType.INTEGER,
  })
  currentCycleNo: number;

  @Column({
    allowNull: true,
    field: 'current_day_no',
    defaultValue: null,
    type: DataType.INTEGER,
  })
  currentDayNo: number;

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
    defaultValue: false,
    field: 'is_completed',
    type: DataType.BOOLEAN,
  })
  isCompleted: boolean;

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
