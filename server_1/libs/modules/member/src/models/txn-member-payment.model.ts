import { BelongsTo, Column, CreatedAt, DataType, HasOne, Model, Scopes, Table, UpdatedAt } from 'sequelize-typescript';
import { getCreatedByUserInclude, getUpdatedByUserInclude, MstAdminUser, MstFranchise } from '@server_1/core';
import { MstCountry, MstPaymentMode, MstPaymentStatus, MstState, TxnAddress } from '@server_1/platform';
import { MstProgram, MstProgramPlan } from '@server_1/modules/program-plan';
import { TxnMember } from './txn-member.model';
import { TxnMemberDietPlan } from './txn-member-diet-plan.model';
import {
  IMemberAddress,
  InputLengthEnum,
  PaymentSourceEnum,
  TaxMode,
  TaxTypeEnum,
} from '@eatfit247-shared-lib';

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
      {
        model: MstFranchise,
        as: 'franchise',
        required: false,
        attributes: ['franchiseId', 'companyName'],
      },
      {
        model: TxnMemberDietPlan,
        as: 'memberDietPlan',
        required: false,
        attributes: ['noOfCycle', 'daysInCycle', 'currentCycleNo', 'currentDayNo'],
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
        model: MstFranchise,
        as: 'franchise',
        required: false,
        attributes: ['franchiseId', 'companyName'],
      },
      {
        model: TxnMemberDietPlan,
        as: 'memberDietPlan',
        required: false,
        attributes: ['noOfCycle', 'daysInCycle', 'currentCycleNo', 'currentDayNo'],
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
    field: 'franchise_id',
    type: DataType.INTEGER,
  })
  declare franchiseId: number;
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
    allowNull: true,
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
    type: DataType.DATE,
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
    allowNull: true,
    field: 'member_address',
    type: DataType.JSONB,
  })
  declare memberAddress: {
    address: IMemberAddress | null;
    billingAddress: IMemberAddress | null;
  };
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
  @Column({
    allowNull: true,
    field: 'order_amount',
    type: DataType.DECIMAL(10, 2),
  })
  declare orderAmount: number;
  @Column({
    allowNull: true,
    field: 'tax_amount',
    type: DataType.DECIMAL(10, 2),
  })
  declare taxAmount: number;
  @Column({
    allowNull: true,
    field: 'total_amount',
    type: DataType.DECIMAL(10, 2),
  })
  declare totalAmount: number;
  @Column({
    allowNull: true,
    defaultValue: 0,
    field: 'discount_amount',
    type: DataType.DECIMAL(10, 2),
  })
  declare discountAmount: number;
  @Column({
    allowNull: true,
    field: 'currency',
    type: DataType.STRING(3),
  })
  declare currency: string;
  @Column({
    allowNull: true,
    field: 'tax_obj',
    type: DataType.JSONB,
  })
  declare taxObj: Record<string, { amount: number; taxPercentage: number }>;
  @Column({
    allowNull: true,
    field: 'tax_type',
    type: DataType.ENUM('GST', 'VAT', 'SALES_TAX', 'NONE'),
  })
  declare taxType: TaxTypeEnum;
  @Column({
    allowNull: true,
    field: 'tax_mode',
    type: DataType.ENUM(
      'DOMESTIC_GST',
      'EXPORT_OF_SERVICE',
      'VAT',
      'RCM_IMPORT_SERVICE',
      'SALES_TAX',
      'NO_TAX',
    ),
  })
  declare taxMode: TaxMode;
  @Column({
    allowNull: true,
    field: 'tax_percentage',
    type: DataType.DECIMAL(5, 2),
  })
  declare taxPercentage: number;
  @Column({
    allowNull: true,
    defaultValue: false,
    field: 'is_lut_applied',
    type: DataType.BOOLEAN,
  })
  declare isLutApplied: boolean;
  @Column({
    allowNull: true,
    field: 'jurisdiction',
    type: DataType.JSONB,
  })
  declare jurisdiction: {
    entityCountry: string;
    customerCountry: string;
    placeOfSupply: string;
  };
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
  @BelongsTo(() => MstFranchise, {
    foreignKey: 'franchiseId',
    targetKey: 'franchiseId',
    as: 'franchise',
  })
  declare franchise: MstFranchise;
  @HasOne(() => TxnMemberDietPlan, {
    foreignKey: 'memberPaymentId',
    sourceKey: 'memberPaymentId',
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

