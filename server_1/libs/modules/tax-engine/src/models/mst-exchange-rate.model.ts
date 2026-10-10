import { Column, CreatedAt, DataType, Model, Table, UpdatedAt } from 'sequelize-typescript';

/** Exchange rates by date and source (roadmap 4.6, group 9). */
@Table({
  freezeTableName: true,
  modelName: 'mst_exchange_rates',
  schema: 'public',
  tableName: 'mst_exchange_rates',
})
export class MstExchangeRate extends Model<MstExchangeRate> {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true, field: 'exchange_rate_id' })
  declare exchangeRateId: number;

  @Column({ allowNull: false, field: 'rate_date', type: DataType.DATEONLY })
  declare rateDate: string;

  @Column({ allowNull: false, field: 'from_currency', type: DataType.STRING(3) })
  declare fromCurrency: string;

  @Column({ allowNull: false, field: 'to_currency', type: DataType.STRING(3) })
  declare toCurrency: string;

  @Column({ allowNull: false, field: 'rate', type: DataType.DECIMAL(18, 8) })
  declare rate: number;

  @Column({ allowNull: false, field: 'source', type: DataType.STRING(20) })
  declare source: string;

  @Column({ allowNull: true, field: 'valid_to', type: DataType.DATEONLY })
  declare validTo: string | null;

  @Column({ allowNull: true, field: 'note', type: DataType.STRING(255) })
  declare note: string | null;

  @Column({ allowNull: false, defaultValue: true, field: 'active', type: DataType.BOOLEAN })
  declare active: boolean;

  @Column({ allowNull: true, field: 'created_by', type: DataType.INTEGER })
  declare createdBy: number | null;

  @Column({ allowNull: true, field: 'modified_by', type: DataType.INTEGER })
  declare modifiedBy: number | null;

  @CreatedAt
  @Column({ allowNull: false, field: 'created_at' })
  declare createdAt: Date;

  @UpdatedAt
  @Column({ allowNull: false, field: 'updated_at' })
  declare updatedAt: Date;

  @Column({ allowNull: true, field: 'created_ip', type: DataType.STRING(50) })
  declare createdIp: string | null;

  @Column({ allowNull: true, field: 'modified_ip', type: DataType.STRING(50) })
  declare modifiedIp: string | null;
}
