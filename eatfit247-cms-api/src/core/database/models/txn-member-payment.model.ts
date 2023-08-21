import { BelongsTo, Column, CreatedAt, DataType, Model, Table, UpdatedAt } from 'sequelize-typescript';
import { MstAdminUser } from './mst-admin-user.model';
import { TxnMember } from './txn-member.model';
import { MstPaymentMode } from './mst-payment-mode.model';
import { TxnAddress } from './txn-address.model';
import { MstPaymentStatus } from './mst-payment-status.model';
import { MstProgram } from './mst-program.model';
import { MstProgramPlan } from './mst-program-plan.model';

@Table({
  modelName: 'txn_member_payment',
  schema: 'public',
  indexes: [
    {
      unique: true,
      fields: ['invoice_id'],
      name: 'ix_uk_txn_member_payment_invoice_id',
    },
    {
      unique: false,
      fields: ['member_id'],
      name: 'ix_txn_member_payment_member_id',
    },
  ],
})
export class TxnMemberPayment extends Model<TxnMemberPayment> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'member_payment_id',
    autoIncrement: true,
  })
  memberPaymentId: number;

  @BelongsTo(() => TxnMember, {
    foreignKey: 'memberId',
    targetKey: 'memberId',
    as: 'MemberPayment',
  })
  @Column({
    allowNull: false,
    field: 'member_id',
    type: DataType.INTEGER,
  })
  memberId: number;

  @BelongsTo(() => MstPaymentMode, {
    foreignKey: 'paymentModeId',
    targetKey: 'paymentModeId',
    as: 'MemberPaymentMode',
  })
  @Column({
    allowNull: false,
    field: 'payment_mode_id',
    type: DataType.INTEGER,
  })
  paymentModeId: number;

  @BelongsTo(() => MstProgram, {
    foreignKey: 'programId',
    targetKey: 'programId',
    as: 'MemberPaymentProgram',
  })
  @Column({
    allowNull: false,
    field: 'program_id',
    type: DataType.INTEGER,
  })
  programId: number;

  @BelongsTo(() => MstProgramPlan, {
    foreignKey: 'programPlanId',
    targetKey: 'programPlanId',
    as: 'MemberPaymentProgramPlan',
  })
  @Column({
    allowNull: false,
    field: 'program_plan_id',
    type: DataType.INTEGER,
  })
  programPlanId: number;

  @BelongsTo(() => TxnAddress, {
    foreignKey: 'addressId',
    targetKey: 'addressId',
    as: 'MemberAddress',
  })
  @Column({
    allowNull: true,
    field: 'address_id',
    type: DataType.INTEGER,
  })
  addressId: number;

  @BelongsTo(() => TxnAddress, {
    foreignKey: 'billingAddressId',
    targetKey: 'addressId',
    as: 'MemberBillingAddress',
  })
  @Column({
    allowNull: true,
    field: 'billing_address_id',
    type: DataType.INTEGER,
  })
  billingAddressId: number;

  @Column({
    allowNull: true,
    field: 'transaction_id',
    type: DataType.STRING(250),
  })
  transactionId: string;

  @Column({
    allowNull: true,
    field: 'invoice_id',
    type: DataType.STRING(100),
  })
  invoiceId: string;

  @BelongsTo(() => MstPaymentStatus, {
    foreignKey: 'paymentStatusId',
    targetKey: 'paymentStatusId',
    as: 'MemberPaymentStatus',
  })
  @Column({
    allowNull: false,
    field: 'payment_status_id',
    type: DataType.INTEGER,
  })
  paymentStatusId: number;

  @Column({
    allowNull: true,
    field: 'promo_code',
    type: DataType.STRING(100),
  })
  promoCode: string;

  @Column({
    allowNull: false,
    field: 'is_tax_applicable',
    type: DataType.BOOLEAN,
  })
  isTaxApplicable: boolean;

  @Column({
    allowNull: false,
    field: 'payment_date',
    type: DataType.DATEONLY,
  })
  paymentDate: Date;

  @Column({
    allowNull: false,
    defaultValue: null,
    field: 'payment_obj',
    type: DataType.JSONB,
  })
  paymentObj: string;

  @Column({
    allowNull: true,
    defaultValue: null,
    field: 'gst_number',
    type: DataType.STRING(50),
  })
  gstNumber: string;

  @Column({
    allowNull: true,
    defaultValue: null,
    field: 'refund_obj',
    type: DataType.JSONB,
  })
  refundObject: string;

  @Column({
    allowNull: true,
    defaultValue: null,
    field: 'payment_gateway_response',
    type: DataType.JSONB,
  })
  paymentGatewayResponse: string;

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
