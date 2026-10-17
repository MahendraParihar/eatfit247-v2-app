import { Column, CreatedAt, DataType, Model, Table, UpdatedAt } from 'sequelize-typescript';

/** A credited line of a Tax Credit Note. */
@Table({ freezeTableName: true, modelName: 'txn_credit_note_items', schema: 'public', tableName: 'txn_credit_note_items' })
export class TxnCreditNoteItem extends Model<TxnCreditNoteItem> {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true, field: 'credit_note_item_id' })
  declare creditNoteItemId: number;
  @Column({ allowNull: false, field: 'credit_note_id', type: DataType.INTEGER })
  declare creditNoteId: number;
  @Column({ allowNull: false, field: 'description', type: DataType.STRING(255) })
  declare description: string;
  @Column({ allowNull: false, field: 'taxable_amount', type: DataType.DECIMAL(14, 3) })
  declare taxableAmount: number;
  @Column({ allowNull: true, field: 'tax_percentage', type: DataType.DECIMAL(5, 2) })
  declare taxPercentage: number | null;
  @Column({ allowNull: false, field: 'tax_amount', type: DataType.DECIMAL(14, 3) })
  declare taxAmount: number;
  @Column({ allowNull: false, field: 'total_amount', type: DataType.DECIMAL(14, 3) })
  declare totalAmount: number;
  @Column({ allowNull: false, defaultValue: true, field: 'active', type: DataType.BOOLEAN })
  declare active: boolean;
  @CreatedAt
  @Column({ allowNull: false, field: 'created_at' })
  declare createdAt: Date;
  @UpdatedAt
  @Column({ allowNull: false, field: 'updated_at' })
  declare updatedAt: Date;
}
