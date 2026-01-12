import { BelongsTo, Column, CreatedAt, DataType, Model, Scopes, Table, UpdatedAt } from 'sequelize-typescript';
import { getCreatedByUserInclude, getUpdatedByUserInclude, MstAdminUser } from '@server_1/core';
import { MstAddressType, MstCountry, MstPaymentMode, MstPaymentStatus, MstState, TxnAddress } from '@server_1/platform';
import { MstProgram, MstProgramPlan } from '@server_1/modules/program-plan';
import { TxnMember } from './txn-member.model';
import { IMemberPaymentObject, InputLengthEnum, PaymentSourceEnum } from '@eatfit247-shared-lib';

@Table({
  freezeTableName: true,
  modelName: 'txn_member_payments',
  schema: 'public',
  tableName: 'txn_member_payments',
  indexes: [
    {
      unique: false,
      fields: ['member_id'],
      name: 'ix_txn_member_payment_member_id',
    },
    {
      unique: true,
      fields: ['invoice_id'],
      name: 'ix_uk_txn_member_payment_invoice_id',
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
        model: MstPaymentMode,
        as: 'paymentMode',
        required: false,
        attributes: ['paymentModeId', 'paymentMode'],
      },
      {
        model: MstPaymentStatus,
        as: 'paymentStatus',
        required: false,
        attributes: ['paymentStatusId', 'paymentStatus'],
      },
      {
        model: MstProgramPlan,
        as: 'programPlan',
        required: false,
        attributes: ['programPlanId', 'plan'],
      },
      {
        model: MstProgram,
        as: 'program',
        required: false,
        attributes: ['programId', 'program'],
      },
      {
        model: TxnAddress,
        as: 'address',
        required: false,
        attributes: ['addressId', 'postalAddress', 'cityVillage', 'pinCode'],
      },
      {
        model: TxnAddress,
        as: 'billingAddress',
        required: false,
        attributes: ['addressId', 'postalAddress', 'cityVillage', 'pinCode'],
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
        attributes: ['memberId', 'firstName', 'lastName', 'emailId', 'contactNumber'],
      },
      {
        model: MstPaymentMode,
        as: 'paymentMode',
        required: false,
        attributes: ['paymentModeId', 'paymentMode'],
      },
      {
        model: MstPaymentStatus,
        as: 'paymentStatus',
        required: false,
        attributes: ['paymentStatusId', 'paymentStatus'],
      },
      {
        model: MstProgramPlan,
        as: 'programPlan',
        required: false,
        attributes: ['programPlanId', 'plan'],
      },
      {
        model: MstProgram,
        as: 'program',
        required: false,
        attributes: ['programId', 'program'],
      },
      {
        model: TxnAddress,
        as: 'address',
        required: false,
        include: [
          {
            model: MstAddressType,
            as: 'addressType',
            required: false,
            attributes: ['addressTypeId', 'addressType'],
          },
          {
            model: MstCountry,
            as: 'country',
            required: true,
            attributes: ['countryId', 'country', 'countryCode'],
          },
          {
            model: MstState,
            as: 'state',
            required: true,
            attributes: ['stateId', 'state', 'code'],
          },
        ],
      },
      {
        model: TxnAddress,
        as: 'billingAddress',
        required: false,
        include: [
          {
            model: MstAddressType,
            as: 'addressType',
            required: false,
            attributes: ['addressTypeId', 'addressType'],
          },
          {
            model: MstCountry,
            as: 'country',
            required: true,
            attributes: ['countryId', 'country', 'countryCode'],
          },
          {
            model: MstState,
            as: 'state',
            required: true,
            attributes: ['stateId', 'state', 'code'],
          },
        ],
      },
    ],
  },
}))
export class TxnMemberPayment extends Model<TxnMemberPayment> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'member_payment_id',
    autoIncrement: true,
  })
  declare memberPaymentId: number;
  @Column({
    allowNull: false,
    field: 'member_id',
    type: DataType.INTEGER,
  })
  declare memberId: number;
  @Column({
    allowNull: true,
    field: 'payment_mode_id',
    type: DataType.INTEGER,
  })
  declare paymentModeId: number;
  @Column({
    allowNull: false,
    field: 'program_plan_id',
    type: DataType.INTEGER,
  })
  declare programPlanId: number;
  @Column({
    allowNull: false,
    field: 'program_id',
    type: DataType.INTEGER,
  })
  declare programId: number;
  @Column({
    allowNull: true,
    field: 'address_id',
    type: DataType.INTEGER,
  })
  declare addressId: number;
  @Column({
    allowNull: true,
    field: 'transaction_id',
    type: DataType.STRING(250),
  })
  declare transactionId: string;
  @Column({
    allowNull: false,
    field: 'payment_date',
    type: DataType.DATEONLY,
  })
  declare paymentDate: Date;
  @Column({
    allowNull: true,
    unique: true,
    field: 'invoice_id',
    type: DataType.STRING(100),
  })
  declare invoiceId: string;
  @Column({
    allowNull: false,
    field: 'payment_status_id',
    type: DataType.INTEGER,
  })
  declare paymentStatusId: number;
  @Column({
    allowNull: true,
    field: 'promo_code',
    type: DataType.STRING(100),
  })
  declare promoCode: string;
  @Column({
    allowNull: false,
    field: 'is_tax_applicable',
    type: DataType.BOOLEAN,
  })
  declare isTaxApplicable: boolean;
  @Column({
    allowNull: false,
    field: 'payment_obj',
    type: DataType.JSONB,
  })
  declare paymentObj: IMemberPaymentObject;
  @Column({
    allowNull: true,
    field: 'refund_obj',
    type: DataType.JSONB,
  })
  declare refundObj: any;
  @Column({
    allowNull: true,
    field: 'payment_gateway_response',
    type: DataType.JSONB,
  })
  declare paymentGatewayResponse: any;
  @Column({
    allowNull: false,
    defaultValue: true,
    field: 'active',
    type: DataType.BOOLEAN,
  })
  declare active: boolean;
  @Column({
    allowNull: true,
    field: 'gst_number',
    type: DataType.STRING(50),
  })
  declare gstNumber: string;
  @Column({
    allowNull: true,
    field: 'billing_address_id',
    type: DataType.INTEGER,
  })
  declare billingAddressId: number;
  @Column({
    allowNull: false,
    defaultValue: PaymentSourceEnum.MANUAL,
    field: 'payment_source',
    type: DataType.STRING(30),
  })
  declare paymentSource: PaymentSourceEnum;
  @Column({
    allowNull: true,
    field: 'gateway_provider',
    type: DataType.STRING(50),
  })
  declare gatewayProvider: string;
  @Column({
    allowNull: true,
    field: 'gateway_order_id',
    type: DataType.STRING(100),
  })
  declare gatewayOrderId: string;
  @Column({
    allowNull: true,
    field: 'gateway_payment_id',
    type: DataType.STRING(100),
  })
  declare gatewayPaymentId: string;
  @Column({
    allowNull: true,
    field: 'payment_link',
    type: DataType.STRING(500),
  })
  declare paymentLink: string;
  @BelongsTo(() => TxnMember, {
    foreignKey: 'memberId',
    targetKey: 'memberId',
    as: 'member',
  })
  declare member: TxnMember;
  @BelongsTo(() => MstPaymentMode, {
    foreignKey: 'paymentModeId',
    targetKey: 'paymentModeId',
    as: 'paymentMode',
  })
  declare paymentMode: MstPaymentMode;
  @BelongsTo(() => MstPaymentStatus, {
    foreignKey: 'paymentStatusId',
    targetKey: 'paymentStatusId',
    as: 'paymentStatus',
  })
  declare paymentStatus: MstPaymentStatus;
  @BelongsTo(() => MstProgramPlan, {
    foreignKey: 'programPlanId',
    targetKey: 'programPlanId',
    as: 'programPlan',
  })
  declare programPlan: MstProgramPlan;
  @BelongsTo(() => MstProgram, {
    foreignKey: 'programId',
    targetKey: 'programId',
    as: 'program',
  })
  declare program: MstProgram;
  @BelongsTo(() => TxnAddress, {
    foreignKey: 'addressId',
    targetKey: 'addressId',
    as: 'address',
  })
  declare address: TxnAddress;
  @BelongsTo(() => TxnAddress, {
    foreignKey: 'billingAddressId',
    targetKey: 'addressId',
    as: 'billingAddress',
  })
  declare billingAddress: TxnAddress;
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

