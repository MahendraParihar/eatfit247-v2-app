import { BelongsTo, Column, CreatedAt, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { MstCourierProvider } from './mst-courier-provider.model';
import { TxnShipment } from './txn-shipment.model';

@Table({
  freezeTableName: true,
  modelName: 'txn_courier_api_logs',
  schema: 'public',
  tableName: 'txn_courier_api_logs',
  indexes: [
    {
      unique: false,
      fields: ['shipment_id'],
      name: 'idx_api_logs_shipment',
    },
  ],
})
export class TxnCourierApiLog extends Model<TxnCourierApiLog> {
  @Column({
    type: DataType.BIGINT,
    primaryKey: true,
    field: 'api_log_id',
    autoIncrement: true,
  })
  declare apiLogId: number;

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
    field: 'request_type',
    type: DataType.STRING(50),
  })
  declare requestType: string;

  @Column({
    allowNull: true,
    field: 'request_payload',
    type: DataType.JSONB,
  })
  declare requestPayload: Record<string, any>;

  @Column({
    allowNull: true,
    field: 'response_payload',
    type: DataType.JSONB,
  })
  declare responsePayload: Record<string, any>;

  @Column({
    allowNull: true,
    field: 'http_status',
    type: DataType.INTEGER,
  })
  declare httpStatus: number;

  @Column({
    allowNull: true,
    field: 'error_message',
    type: DataType.TEXT,
  })
  declare errorMessage: string;

  @Column({
    allowNull: true,
    field: 'response_time_ms',
    type: DataType.INTEGER,
  })
  declare responseTimeMs: number;

  @CreatedAt
  @Column({
    allowNull: true,
    field: 'created_at',
    type: DataType.DATE,
  })
  declare createdAt: Date;
}

