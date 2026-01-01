import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({
  tableName: 'mst_currencies',
  schema: 'public',
  freezeTableName: true,
  timestamps: false,
})
export class MstCurrencyModel extends Model<MstCurrencyModel> {
  @Column({
    field: 'currency_id',
    allowNull: false,
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  declare currencyId: number;
  
  @Column({
    field: 'currency_code',
    allowNull: false,
    type: DataType.STRING(10),
  })
  declare currencyCode: string;
  
  @Column({
    field: 'symbol',
    allowNull: false,
    type: DataType.STRING(10),
  })
  declare symbol: string;
  
  @Column({
    field: 'label',
    allowNull: false,
    type: DataType.STRING(100),
  })
  declare label: string;
}

