import { BelongsTo, Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({
  freezeTableName: true,
  schema: 'public',
  tableName: 'mst_invoice_sequences',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['franchise_id', 'invoice_type', 'financial_year'],
      name: 'uq_mst_invoice_sequences_franchise_type_year',
    },
  ],
})
export class InvoiceSequenceModel extends Model<InvoiceSequenceModel> {
  @Column({
    type: DataType.UUID,
    primaryKey: true,
    field: 'id',
    defaultValue: DataType.UUIDV4,
  })
  declare id: string;
  @Column({
    allowNull: false,
    field: 'franchise_id',
    type: DataType.INTEGER,
  })
  declare franchiseId: number;
  @Column({
    allowNull: false,
    field: 'invoice_type',
    type: DataType.STRING(10),
  })
  declare invoiceType: 'PRODUCT' | 'SERVICE';
  @Column({
    allowNull: false,
    field: 'financial_year',
    type: DataType.STRING(10),
  })
  declare financialYear: string;
  @Column({
    allowNull: false,
    defaultValue: 0,
    field: 'current_number',
    type: DataType.INTEGER,
  })
  declare currentNumber: number;
}

