import {
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  HasMany,
  Model,
  Scopes,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';
import { getCreatedByUserInclude, getUpdatedByUserInclude, MstAdminUser } from '@server_1/core';
import { InputLengthEnum } from '@eatfit247-shared-lib';
import { TxnCourierProviderAccount } from './txn-courier-provider-account.model';

@Table({
  freezeTableName: true,
  modelName: 'mst_courier_providers',
  schema: 'public',
  tableName: 'mst_courier_providers',
})
@Scopes(() => ({
  list: {
    include: [getCreatedByUserInclude(false), getUpdatedByUserInclude(false)],
  },
  details: {
    include: [
      getCreatedByUserInclude(false),
      getUpdatedByUserInclude(false),
      {
        model: TxnCourierProviderAccount,
        as: 'accounts',
        required: false,
      },
    ],
  },
}))
export class MstCourierProvider extends Model<MstCourierProvider> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'courier_provider_id',
    autoIncrement: true,
  })
  declare courierProviderId: number;

  @Column({
    allowNull: false,
    unique: true,
    field: 'provider_code',
    type: DataType.STRING(30),
  })
  declare providerCode: string;

  @Column({
    allowNull: false,
    field: 'provider_name',
    type: DataType.STRING(100),
  })
  declare providerName: string;

  @Column({
    allowNull: false,
    field: 'auth_type',
    type: DataType.ENUM('API_KEY', 'JWT', 'BASIC'),
  })
  declare authType: 'API_KEY' | 'JWT' | 'BASIC';

  @Column({
    allowNull: true,
    defaultValue: true,
    field: 'supports_rate_api',
    type: DataType.BOOLEAN,
  })
  declare supportsRateApi: boolean;

  @Column({
    allowNull: true,
    defaultValue: true,
    field: 'supports_webhook',
    type: DataType.BOOLEAN,
  })
  declare supportsWebhook: boolean;

  @Column({
    allowNull: true,
    defaultValue: 1,
    field: 'priority_order',
    type: DataType.INTEGER,
  })
  declare priorityOrder: number;

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

  @HasMany(() => TxnCourierProviderAccount, {
    foreignKey: 'courierProviderId',
    sourceKey: 'courierProviderId',
    as: 'accounts',
  })
  declare accounts?: TxnCourierProviderAccount[];
}
