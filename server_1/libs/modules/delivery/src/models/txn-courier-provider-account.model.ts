import { BelongsTo, Column, CreatedAt, DataType, ForeignKey, Model, Scopes, Table, UpdatedAt } from 'sequelize-typescript';
import { getCreatedByUserInclude, getUpdatedByUserInclude, MstAdminUser, MstFranchise } from '@server_1/core';
import { InputLengthEnum } from '@eatfit247-shared-lib';
import { MstCourierProvider } from './mst-courier-provider.model';

@Table({
  freezeTableName: true,
  modelName: 'txn_courier_provider_accounts',
  schema: 'public',
  tableName: 'txn_courier_provider_accounts',
  indexes: [
    {
      unique: true,
      fields: ['provider_id', 'franchise_id'],
      name: 'uq_courier_account_provider_franchise',
    },
  ],
})
@Scopes(() => ({
  list: {
    include: [
      getCreatedByUserInclude(false),
      getUpdatedByUserInclude(false),
      {
        model: MstCourierProvider,
        as: 'provider',
        required: false,
        attributes: ['providerId', 'providerCode', 'providerName'],
      },
      {
        model: MstFranchise,
        as: 'franchise',
        required: false,
        attributes: ['franchiseId', 'companyName'],
      },
    ],
  },
  details: {
    include: [
      getCreatedByUserInclude(false),
      getUpdatedByUserInclude(false),
      {
        model: MstCourierProvider,
        as: 'provider',
        required: false,
      },
      {
        model: MstFranchise,
        as: 'franchise',
        required: false,
      },
    ],
  },
}))
export class TxnCourierProviderAccount extends Model<TxnCourierProviderAccount> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'provider_account_id',
    autoIncrement: true,
  })
  declare providerAccountId: number;

  @ForeignKey(() => MstCourierProvider)
  @Column({
    allowNull: false,
    field: 'provider_id',
    type: DataType.INTEGER,
  })
  declare providerId: number;

  @BelongsTo(() => MstCourierProvider, {
    foreignKey: 'providerId',
    targetKey: 'providerId',
    as: 'provider',
  })
  declare provider: MstCourierProvider;

  @ForeignKey(() => MstFranchise)
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
    allowNull: true,
    field: 'account_name',
    type: DataType.STRING(100),
  })
  declare accountName: string;

  @Column({
    allowNull: false,
    field: 'api_base_url',
    type: DataType.TEXT,
  })
  declare apiBaseUrl: string;

  @Column({
    allowNull: true,
    field: 'api_key',
    type: DataType.TEXT,
  })
  declare apiKey: string;

  @Column({
    allowNull: true,
    field: 'api_secret',
    type: DataType.TEXT,
  })
  declare apiSecret: string;

  @Column({
    allowNull: true,
    field: 'username',
    type: DataType.TEXT,
  })
  declare username: string;

  @Column({
    allowNull: true,
    field: 'password_encrypted',
    type: DataType.TEXT,
  })
  declare passwordEncrypted: string;

  @Column({
    allowNull: true,
    field: 'auth_token',
    type: DataType.TEXT,
  })
  declare authToken: string;

  @Column({
    allowNull: true,
    field: 'token_expiry',
    type: DataType.DATE,
  })
  declare tokenExpiry: Date;

  @Column({
    allowNull: true,
    field: 'webhook_secret',
    type: DataType.TEXT,
  })
  declare webhookSecret: string;

  @Column({
    allowNull: true,
    defaultValue: true,
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

