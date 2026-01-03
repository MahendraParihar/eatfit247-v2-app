import { Column, DataType, Model, Scopes, Table } from 'sequelize-typescript';
import { CommonScopes } from '@server_1/core';

@Table({
  freezeTableName: true,
  modelName: 'mst_payment_gateway',
  schema: 'public',
  tableName: 'mst_payment_gateway',
})
@Scopes(() => ({
  list: CommonScopes.list(),
  details: CommonScopes.details(),
}))
export class MstPaymentGateway extends Model<MstPaymentGateway> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'payment_gateway_id',
    autoIncrement: true,
  })
  declare paymentGatewayId: number;

  @Column({
    allowNull: false,
    field: 'code',
    type: DataType.STRING(50),
  })
  declare code: string;

  @Column({
    allowNull: false,
    field: 'name',
    type: DataType.STRING(50),
  })
  declare name: string;

  @Column({
    allowNull: false,
    field: 'provider_country_code',
    type: DataType.STRING(3),
  })
  declare providerCountryCode: string;

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
    field: 'supports_recurring',
    type: DataType.BOOLEAN,
  })
  declare supportsRecurring: boolean;

  @Column({
    allowNull: false,
    defaultValue: false,
    field: 'supports_refund',
    type: DataType.BOOLEAN,
  })
  declare supportsRefund: boolean;

  @Column({
    allowNull: false,
    defaultValue: false,
    field: 'active',
    type: DataType.BOOLEAN,
  })
  declare active: boolean;
}

