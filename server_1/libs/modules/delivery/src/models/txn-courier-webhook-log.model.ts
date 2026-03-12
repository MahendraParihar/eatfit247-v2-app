import { BelongsTo, Column, CreatedAt, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { MstCourierProvider } from './mst-courier-provider.model';
import { TxnCourierProviderAccount } from './txn-courier-provider-account.model';

@Table({
  freezeTableName: true,
  modelName: 'txn_courier_webhook_logs',
  schema: 'public',
  tableName: 'txn_courier_webhook_logs',
  timestamps: false,
  createdAt: true,
  indexes: [
    {
      unique: false,
      fields: ['provider_id'],
      name: 'idx_webhook_logs_provider',
    },
    {
      unique: false,
      fields: ['processed'],
      name: 'idx_webhook_logs_processed',
      where: { processed: false },
    },
  ],
})
export class TxnCourierWebhookLog extends Model<TxnCourierWebhookLog> {
  @Column({
    type: DataType.BIGINT,
    primaryKey: true,
    field: 'webhook_log_id',
    autoIncrement: true,
  })
  declare webhookLogId: number;

  @ForeignKey(() => MstCourierProvider)
  @Column({
    allowNull: true,
    field: 'provider_id',
    type: DataType.INTEGER,
  })
  declare courierProviderId: number;

  @BelongsTo(() => MstCourierProvider, {
  foreignKey: 'courierProviderId',
  targetKey: 'courierProviderId',
    as: 'provider',
  })
  declare provider: MstCourierProvider;

  @ForeignKey(() => TxnCourierProviderAccount)
  @Column({
    allowNull: true,
    field: 'provider_account_id',
    type: DataType.INTEGER,
  })
  declare providerAccountId: number;

  @BelongsTo(() => TxnCourierProviderAccount, {
    foreignKey: 'providerAccountId',
    targetKey: 'providerAccountId',
    as: 'providerAccount',
  })
  declare providerAccount: TxnCourierProviderAccount;

  @Column({
    allowNull: false,
    field: 'payload',
    type: DataType.JSONB,
  })
  declare payload: Record<string, unknown>;

  @Column({
    allowNull: true,
    field: 'headers',
    type: DataType.JSONB,
  })
  declare headers: Record<string, unknown>;

  @Column({
    allowNull: true,
    field: 'signature_valid',
    type: DataType.BOOLEAN,
  })
  declare signatureValid: boolean;

  @Column({
    allowNull: true,
    defaultValue: false,
    field: 'processed',
    type: DataType.BOOLEAN,
  })
  declare processed: boolean;

  @Column({
    allowNull: true,
    field: 'error_message',
    type: DataType.TEXT,
  })
  declare errorMessage: string;

  @CreatedAt
  @Column({
    allowNull: true,
    field: 'created_at',
    type: DataType.DATE,
  })
  declare createdAt: Date;
}

