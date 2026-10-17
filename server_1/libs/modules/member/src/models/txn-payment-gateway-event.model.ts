import {
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  ForeignKey,
  Model,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';
import { GatewayEventResultEnum } from '@eatfit247-shared-lib';
import { TxnMemberPayment } from './txn-member-payment.model';
import { TxnMemberProduct } from './txn-member-product.model';

/**
 * Append-only log of payment-gateway webhook events.
 * Unique on (provider, event_id) so a redelivered event is detected before processing.
 */
@Table({
  freezeTableName: true,
  modelName: 'txn_payment_gateway_events',
  schema: 'public',
  tableName: 'txn_payment_gateway_events',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['provider', 'event_id'],
      name: 'ix_uq_txn_payment_gateway_events_provider_event',
    },
    {
      unique: false,
      fields: ['gateway_order_id'],
      name: 'idx_txn_payment_gateway_events_order',
    },
  ],
})
export class TxnPaymentGatewayEvent extends Model<TxnPaymentGatewayEvent> {
  @Column({
    type: DataType.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    field: 'payment_gateway_event_id',
  })
  declare paymentGatewayEventId: number;

  @Column({
    allowNull: false,
    field: 'provider',
    type: DataType.STRING(20),
  })
  declare provider: string;

  @Column({
    allowNull: false,
    field: 'event_id',
    type: DataType.STRING(100),
  })
  declare eventId: string;

  @Column({
    allowNull: false,
    field: 'event_type',
    type: DataType.STRING(100),
  })
  declare eventType: string;

  @Column({
    allowNull: true,
    field: 'gateway_order_id',
    type: DataType.STRING(100),
  })
  declare gatewayOrderId: string | null;

  @Column({
    allowNull: true,
    field: 'gateway_payment_id',
    type: DataType.STRING(100),
  })
  declare gatewayPaymentId: string | null;

  /** Major units of `currency`, converted from the gateway's minor units. */
  @Column({
    allowNull: true,
    field: 'amount',
    type: DataType.DECIMAL(14, 3),
  })
  declare amount: number | null;

  @Column({
    allowNull: true,
    field: 'currency',
    type: DataType.STRING(3),
  })
  declare currency: string | null;

  @Column({
    allowNull: false,
    field: 'signature_valid',
    type: DataType.BOOLEAN,
  })
  declare signatureValid: boolean;

  @Column({
    allowNull: false,
    field: 'payload',
    type: DataType.JSONB,
  })
  declare payload: Record<string, unknown>;

  /** NULL while processing, then the outcome. */
  @Column({
    allowNull: true,
    field: 'result',
    type: DataType.STRING(30),
  })
  declare result: GatewayEventResultEnum | null;

  @Column({
    allowNull: true,
    field: 'message',
    type: DataType.TEXT,
  })
  declare message: string | null;

  /** The paid order's promo code had already reached its usage limit. */
  @Column({
    allowNull: false,
    defaultValue: false,
    field: 'promo_over_limit',
    type: DataType.BOOLEAN,
  })
  declare promoOverLimit: boolean;

  @ForeignKey(() => TxnMemberPayment)
  @Column({
    allowNull: true,
    field: 'member_payment_id',
    type: DataType.INTEGER,
  })
  declare memberPaymentId: number | null;

  @BelongsTo(() => TxnMemberPayment, {
    foreignKey: 'memberPaymentId',
    targetKey: 'memberPaymentId',
    as: 'memberPayment',
  })
  declare memberPayment: TxnMemberPayment;

  @ForeignKey(() => TxnMemberProduct)
  @Column({
    allowNull: true,
    field: 'member_product_id',
    type: DataType.INTEGER,
  })
  declare memberProductId: number | null;

  @BelongsTo(() => TxnMemberProduct, {
    foreignKey: 'memberProductId',
    targetKey: 'memberProductId',
    as: 'memberProduct',
  })
  declare memberProduct: TxnMemberProduct;

  @Column({
    allowNull: false,
    defaultValue: DataType.NOW,
    field: 'received_at',
    type: DataType.DATE,
  })
  declare receivedAt: Date;

  @Column({
    allowNull: false,
    defaultValue: true,
    field: 'active',
    type: DataType.BOOLEAN,
  })
  declare active: boolean;

  @Column({
    allowNull: true,
    field: 'created_by',
    type: DataType.INTEGER,
  })
  declare createdBy: number | null;

  @Column({
    allowNull: true,
    field: 'modified_by',
    type: DataType.INTEGER,
  })
  declare modifiedBy: number | null;

  @CreatedAt
  @Column({
    allowNull: false,
    field: 'created_at',
  })
  declare createdAt: Date;

  @UpdatedAt
  @Column({
    allowNull: false,
    field: 'updated_at',
  })
  declare updatedAt: Date;

  @Column({
    allowNull: true,
    field: 'created_ip',
    type: DataType.STRING(50),
  })
  declare createdIp: string | null;

  @Column({
    allowNull: true,
    field: 'modified_ip',
    type: DataType.STRING(50),
  })
  declare modifiedIp: string | null;
}
