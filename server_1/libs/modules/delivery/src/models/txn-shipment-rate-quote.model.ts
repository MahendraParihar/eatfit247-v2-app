import { BelongsTo, Column, CreatedAt, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { MstCourierProvider } from './mst-courier-provider.model';
import { TxnCourierProviderAccount } from './txn-courier-provider-account.model';
import { TxnShipment } from './txn-shipment.model';

@Table({
  freezeTableName: true,
  modelName: 'txn_shipment_rate_quotes',
  schema: 'public',
  tableName: 'txn_shipment_rate_quotes',
  indexes: [
    {
      unique: false,
      fields: ['shipment_id'],
      name: 'idx_rate_quotes_shipment',
    },
  ],
})
export class TxnShipmentRateQuote extends Model<TxnShipmentRateQuote> {
  @Column({
    type: DataType.BIGINT,
    primaryKey: true,
    field: 'rate_quote_id',
    autoIncrement: true,
  })
  declare rateQuoteId: number;

  @ForeignKey(() => TxnShipment)
  @Column({
    allowNull: true,
    field: 'shipment_id',
    type: DataType.BIGINT,
  })
  declare shipmentId: number;

  @BelongsTo(() => TxnShipment, {
    foreignKey: 'shipmentId',
    targetKey: 'shipmentId',
    as: 'shipment',
  })
  declare shipment: TxnShipment;

  @ForeignKey(() => MstCourierProvider)
  @Column({
    allowNull: true,
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
    allowNull: true,
    field: 'service_name',
    type: DataType.STRING(100),
  })
  declare serviceName: string;

  @Column({
    allowNull: true,
    field: 'estimated_days',
    type: DataType.INTEGER,
  })
  declare estimatedDays: number;

  @Column({
    allowNull: true,
    field: 'rate_amount',
    type: DataType.DECIMAL(10, 2),
  })
  declare rateAmount: number;

  @Column({
    allowNull: true,
    field: 'currency',
    type: DataType.STRING(10),
  })
  declare currency: string;

  @Column({
    allowNull: true,
    defaultValue: false,
    field: 'is_selected',
    type: DataType.BOOLEAN,
  })
  declare isSelected: boolean;

  @Column({
    allowNull: true,
    field: 'raw_response',
    type: DataType.JSONB,
  })
  declare rawResponse: Record<string, any>;

  @CreatedAt
  @Column({
    allowNull: true,
    field: 'created_at',
    type: DataType.DATE,
  })
  declare createdAt: Date;
}

