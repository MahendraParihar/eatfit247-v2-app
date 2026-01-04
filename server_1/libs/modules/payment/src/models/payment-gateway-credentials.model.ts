import { BelongsTo, Column, CreatedAt, DataType, Model, Scopes, Table, UpdatedAt } from 'sequelize-typescript';
import { getCreatedByUserInclude, getUpdatedByUserInclude, MstAdminUser } from '@server_1/core';
import { InputLengthEnum } from '@eatfit247-shared-lib';
import { MstFranchisePaymentGateway } from '@server_1/modules/franchise';

@Table({
  freezeTableName: true,
  modelName: 'mst_payment_gateway_credentials',
  schema: 'public',
  tableName: 'mst_payment_gateway_credentials',
  indexes: [
    {
      unique: false,
      fields: ['franchise_payment_gateway_id'],
      name: 'ix_mst_payment_gateway_cred_fpg_id',
    },
  ],
})
@Scopes(() => ({
  list: {
    include: [
      getCreatedByUserInclude(false),
      getUpdatedByUserInclude(false),
      {
        model: MstFranchisePaymentGateway,
        as: 'franchisePaymentGateway',
        required: false,
        attributes: ['franchisePaymentGatewayId'],
      },
    ],
  },
  details: {
    include: [
      getCreatedByUserInclude(false),
      getUpdatedByUserInclude(false),
      {
        model: MstFranchisePaymentGateway,
        as: 'franchisePaymentGateway',
        required: false,
      },
    ],
  },
}))
export class MstPaymentGatewayCredentials extends Model<MstPaymentGatewayCredentials> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'payment_gateway_credential_id',
    autoIncrement: true,
  })
  declare paymentGatewayCredentialId: number;

  @Column({
    allowNull: false,
    field: 'franchise_payment_gateway_id',
    type: DataType.INTEGER,
  })
  declare franchisePaymentGatewayId: number;

  @BelongsTo(() => MstFranchisePaymentGateway, {
    foreignKey: 'franchisePaymentGatewayId',
    targetKey: 'franchisePaymentGatewayId',
    as: 'franchisePaymentGateway',
  })
  declare franchisePaymentGateway: MstFranchisePaymentGateway;

  @Column({
    allowNull: false,
    field: 'api_key_encrypted',
    type: DataType.TEXT,
  })
  declare apiKeyEncrypted: string;

  @Column({
    allowNull: false,
    field: 'api_secret_encrypted',
    type: DataType.TEXT,
  })
  declare apiSecretEncrypted: string;

  @Column({
    allowNull: false,
    field: 'webhook_secret_encrypted',
    type: DataType.TEXT,
  })
  declare webhookSecretEncrypted: string;

  @Column({
    allowNull: false,
    field: 'mode',
    type: DataType.TEXT,
  })
  declare mode: string;

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

