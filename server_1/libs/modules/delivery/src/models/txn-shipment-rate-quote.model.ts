import {
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { MstCourierProvider } from './mst-courier-provider.model';
import { MstWarehouse } from './mst-warehouse.model';
import { TxnCourierProviderAccount } from './txn-courier-provider-account.model';
import { TxnShipment } from './txn-shipment.model';

@Table({
  freezeTableName: true,
  modelName: 'txn_shipment_rate_quotes',
  schema: 'public',
  tableName: 'txn_shipment_rate_quotes',
  timestamps: false,
  createdAt: true,
  indexes: [
    {
      unique: false,
      fields: ['shipment_id'],
      name: 'idx_rate_quotes_shipment',
    },
    {
      unique: false,
      fields: ['provider_id'],
      name: 'idx_rate_quotes_provider',
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
    allowNull: false,
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
    allowNull: false,
    field: 'courier_provider_id',
    type: DataType.INTEGER,
  })
  declare courierProviderId: number;
  @BelongsTo(() => MstCourierProvider, {
    foreignKey: 'courierProviderId',
    targetKey: 'courierProviderId',
    as: 'courierProvider',
  })
  declare courierProvider: MstCourierProvider;
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

  @ForeignKey(() => MstWarehouse)
  @Column({
    allowNull: true,
    field: 'warehouse_id',
    type: DataType.INTEGER,
  })
  declare warehouseId: number;

  @BelongsTo(() => MstWarehouse, {
    foreignKey: 'warehouseId',
    targetKey: 'warehouseId',
    as: 'warehouse',
  })
  declare warehouse: MstWarehouse;

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
    // Note: Sequelize doesn't support CHECK constraints directly,
    // but the database schema has: check (estimated_days >= 0)
  })
  declare estimatedDays: number;
  @Column({
    allowNull: false,
    field: 'rate_amount',
    type: DataType.DECIMAL(10, 2),
  })
  declare rateAmount: number;
  @Column({
    allowNull: false,
    field: 'currency',
    type: DataType.STRING(10),
  })
  declare currency: string;
  @Column({
    allowNull: false,
    defaultValue: true,
    field: 'is_serviceable',
    type: DataType.BOOLEAN,
  })
  declare isServiceable: boolean;

  @Column({
    allowNull: false,
    defaultValue: false,
    field: 'is_selected',
    type: DataType.BOOLEAN,
  })
  declare isSelected: boolean;

  @Column({
    allowNull: true,
    field: 'expires_at',
    type: DataType.DATE,
  })
  declare expiresAt: Date;

  @Column({
    allowNull: true,
    field: 'raw_response',
    type: DataType.JSONB,
  })
  declare rawResponse: Record<string, unknown>;
  @CreatedAt
  @Column({
    allowNull: true,
    field: 'created_at',
    type: DataType.DATE,
  })
  declare createdAt: Date;
}
