import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { MstCourierProvider } from './mst-courier-provider.model';

@Table({
  freezeTableName: true,
  modelName: 'cache_pincode_serviceability',
  schema: 'public',
  tableName: 'cache_pincode_serviceability',
  timestamps: false,
  indexes: [
    {
      unique: false,
      fields: ['expires_at'],
      name: 'idx_pincode_cache_expires',
    },
  ],
})
export class CachePincodeServiceability extends Model<CachePincodeServiceability> {
  @Column({
    type: DataType.STRING(10),
    primaryKey: true,
    field: 'pincode',
  })
  declare pincode: string;

  @ForeignKey(() => MstCourierProvider)
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'provider_id',
  })
  declare providerId: number;

  @BelongsTo(() => MstCourierProvider, {
    foreignKey: 'providerId',
    targetKey: 'providerId',
    as: 'provider',
  })
  declare provider: MstCourierProvider;

  @Column({
    allowNull: false,
    field: 'is_serviceable',
    type: DataType.BOOLEAN,
  })
  declare isServiceable: boolean;

  @Column({
    allowNull: false,
    defaultValue: () => new Date(),
    field: 'checked_at',
    type: DataType.DATE,
  })
  declare checkedAt: Date;

  @Column({
    allowNull: false,
    field: 'expires_at',
    type: DataType.DATE,
  })
  declare expiresAt: Date;
}
