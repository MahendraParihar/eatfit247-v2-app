import { BelongsTo, Column, CreatedAt, DataType, Model, Scopes, Table, UpdatedAt } from 'sequelize-typescript';
import { getCreatedByUserInclude, getUpdatedByUserInclude, MstAdminUser, MstFranchise } from '@server_1/core';
import { MstPaymentGateway } from '@server_1/platform';
import { InputLengthEnum } from '@eatfit247-shared-lib';

@Table({
  freezeTableName: true,
  modelName: 'mst_franchise_payment_gateway',
  schema: 'public',
  tableName: 'mst_franchise_payment_gateway',
  indexes: [
    {
      unique: false,
      fields: ['franchise_id'],
      name: 'ix_mst_franchise_payment_gateway_franchise_id',
    },
    {
      unique: false,
      fields: ['payment_gateway_id'],
      name: 'ix_mst_franchise_payment_gateway_payment_gateway_id',
    },
  ],
})
@Scopes(() => ({
  list: {
    include: [
      getCreatedByUserInclude(false),
      getUpdatedByUserInclude(false),
      {
        model: MstFranchise,
        as: 'franchise',
        required: false,
        attributes: ['franchiseId', 'companyName'],
      },
      {
        model: MstPaymentGateway,
        as: 'paymentGateway',
        required: false,
        attributes: ['paymentGatewayId', 'code', 'name'],
      },
    ],
  },
  details: {
    include: [
      getCreatedByUserInclude(false),
      getUpdatedByUserInclude(false),
      {
        model: MstFranchise,
        as: 'franchise',
        required: false,
        attributes: ['franchiseId', 'companyName'],
      },
      {
        model: MstPaymentGateway,
        as: 'paymentGateway',
        required: false,
        attributes: ['paymentGatewayId', 'code', 'name'],
      },
    ],
  },
}))
export class MstFranchisePaymentGateway extends Model<MstFranchisePaymentGateway> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'franchise_payment_gateway_id',
    autoIncrement: true,
  })
  declare franchisePaymentGatewayId: number;

  @Column({
    allowNull: false,
    field: 'franchise_id',
    type: DataType.INTEGER,
  })
  declare franchiseId: number;

  @BelongsTo(() => MstFranchise, {
    foreignKey: 'franchiseId',
    targetKey: 'franchiseId',
    as: 'franchise',
  })
  declare franchise: MstFranchise;

  @Column({
    allowNull: false,
    field: 'payment_gateway_id',
    type: DataType.INTEGER,
  })
  declare paymentGatewayId: number;

  @BelongsTo(() => MstPaymentGateway, {
    foreignKey: 'paymentGatewayId',
    targetKey: 'paymentGatewayId',
    as: 'paymentGateway',
  })
  declare paymentGateway: MstPaymentGateway;

  @Column({
    allowNull: false,
    field: 'country_code',
    type: DataType.STRING(3),
  })
  declare countryCode: string;

  @Column({
    allowNull: false,
    field: 'currency_code',
    type: DataType.STRING(3),
  })
  declare currencyCode: string;

  @Column({
    allowNull: false,
    defaultValue: false,
    field: 'is_primary',
    type: DataType.BOOLEAN,
  })
  declare isPrimary: boolean;

  @Column({
    allowNull: false,
    defaultValue: true,
    field: 'supports_domestic',
    type: DataType.BOOLEAN,
  })
  declare supportsDomestic: boolean;

  @Column({
    allowNull: false,
    defaultValue: false,
    field: 'supports_international',
    type: DataType.BOOLEAN,
  })
  declare supportsInternational: boolean;

  @Column({
    allowNull: false,
    defaultValue: false,
    field: 'supports_emi',
    type: DataType.BOOLEAN,
  })
  declare supportsEmi: boolean;

  @Column({
    allowNull: false,
    defaultValue: false,
    field: 'supports_upi',
    type: DataType.BOOLEAN,
  })
  declare supportsUpi: boolean;

  @Column({
    allowNull: true,
    field: 'settlement_delay_days',
    type: DataType.INTEGER,
  })
  declare settlementDelayDays: number;

  @Column({
    allowNull: true,
    field: 'gateway_fee_percentage',
    type: DataType.DOUBLE,
  })
  declare gatewayFeePercentage: number;

  @Column({
    allowNull: false,
    defaultValue: false,
    field: 'active',
    type: DataType.BOOLEAN,
  })
  declare active: boolean;

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
    allowNull: false,
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
    allowNull: false,
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
    allowNull: true,
    field: 'created_ip',
    type: DataType.STRING(InputLengthEnum.IP),
  })
  declare createdIp: string;

  @Column({
    allowNull: true,
    field: 'modified_ip',
    type: DataType.STRING(InputLengthEnum.IP),
  })
  declare modifiedIp: string;
}

