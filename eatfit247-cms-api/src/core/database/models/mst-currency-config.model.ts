import { BelongsTo, Column, CreatedAt, DataType, Model, Table, UpdatedAt } from 'sequelize-typescript';
import { MstAdminUser } from './mst-admin-user.model';

@Table({
  modelName: 'mst_currency_config',
  schema: 'public',
})
export class MstCurrencyConfig extends Model<MstCurrencyConfig> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'currency_config_id',
    autoIncrement: true,
  })
  currencyConfigId: number;

  @Column({
    allowNull: false,
    field: 'source_currency_code',
    type: DataType.STRING(10),
  })
  sourceCurrencyCode: string;

  @Column({
    allowNull: false,
    field: 'target_currency_code',
    type: DataType.STRING(10),
  })
  targetCurrencyCode: string;

  @Column({
    allowNull: false,
    field: 'conversion_rate',
    type: DataType.DOUBLE,
  })
  conversionRate: number;

  @Column({
    allowNull: false,
    field: 'conversion_rate_fees_in_percent',
    type: DataType.DOUBLE,
  })
  conversionRateFeesInPercent: number;

  @Column({
    allowNull: false,
    defaultValue: true,
    field: 'active',
  })
  active: boolean;

  @BelongsTo(() => MstAdminUser, {
    foreignKey: 'createdBy',
    targetKey: 'adminId',
    as: 'CreatedBy',
  })
  @Column({
    allowNull: false,
    field: 'created_by',
  })
  createdBy: number;

  @CreatedAt
  @Column({
    allowNull: false,
    field: 'created_at',
  })
  createdAt: Date;

  @BelongsTo(() => MstAdminUser, {
    foreignKey: 'modifiedBy',
    targetKey: 'adminId',
    as: 'ModifiedBy',
  })
  @Column({
    allowNull: false,
    field: 'modified_by',
  })
  modifiedBy: number;

  @UpdatedAt
  @Column({
    allowNull: false,
    field: 'updated_at',
  })
  updatedAt: Date;

  @Column({
    allowNull: false,
    field: 'created_ip',
  })
  createdIp: string;

  @Column({
    allowNull: false,
    field: 'modified_ip',
  })
  modifiedIp: string;
}
