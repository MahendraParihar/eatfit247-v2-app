import { Column, CreatedAt, DataType, HasMany, Model, Table, UpdatedAt } from 'sequelize-typescript';
import { TxnCreditNoteItem } from './txn-credit-note-item.model';

/** Tax Credit Note against an issued invoice (roadmap 4.6, group 10). Never edited or deleted. */
@Table({ freezeTableName: true, modelName: 'txn_credit_notes', schema: 'public', tableName: 'txn_credit_notes' })
export class TxnCreditNote extends Model<TxnCreditNote> {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true, field: 'credit_note_id' })
  declare creditNoteId: number;
  @Column({ allowNull: false, field: 'franchise_id', type: DataType.INTEGER })
  declare franchiseId: number;
  @Column({ allowNull: false, field: 'member_id', type: DataType.INTEGER })
  declare memberId: number;
  @Column({ allowNull: true, field: 'member_payment_id', type: DataType.INTEGER })
  declare memberPaymentId: number | null;
  @Column({ allowNull: true, field: 'member_product_id', type: DataType.INTEGER })
  declare memberProductId: number | null;
  @Column({ allowNull: false, field: 'original_invoice_id', type: DataType.STRING(100) })
  declare originalInvoiceId: string;
  @Column({ allowNull: true, field: 'original_invoice_date', type: DataType.DATEONLY })
  declare originalInvoiceDate: string | null;
  @Column({ allowNull: false, field: 'credit_note_number', type: DataType.STRING(100) })
  declare creditNoteNumber: string;
  @Column({ allowNull: false, field: 'credit_note_date', type: DataType.DATEONLY })
  declare creditNoteDate: string;
  @Column({ allowNull: false, field: 'event_date', type: DataType.DATEONLY })
  declare eventDate: string;
  @Column({ allowNull: false, field: 'reason', type: DataType.STRING(500) })
  declare reason: string;
  @Column({ allowNull: false, field: 'currency', type: DataType.STRING(3) })
  declare currency: string;
  @Column({ allowNull: false, field: 'taxable_amount', type: DataType.DECIMAL(14, 3) })
  declare taxableAmount: number;
  @Column({ allowNull: false, field: 'tax_amount', type: DataType.DECIMAL(14, 3) })
  declare taxAmount: number;
  @Column({ allowNull: false, field: 'total_amount', type: DataType.DECIMAL(14, 3) })
  declare totalAmount: number;
  @Column({ allowNull: true, field: 'tax_type', type: DataType.STRING(20) })
  declare taxType: string | null;
  @Column({ allowNull: true, field: 'tax_category', type: DataType.STRING(20) })
  declare taxCategory: string | null;
  @Column({ allowNull: true, field: 'tax_percentage', type: DataType.DECIMAL(5, 2) })
  declare taxPercentage: number | null;
  @Column({ allowNull: true, field: 'fx_rate', type: DataType.DECIMAL(18, 8) })
  declare fxRate: number | null;
  @Column({ allowNull: true, field: 'fx_rate_date', type: DataType.DATEONLY })
  declare fxRateDate: string | null;
  @Column({ allowNull: true, field: 'fx_source', type: DataType.STRING(20) })
  declare fxSource: string | null;
  @Column({ allowNull: true, field: 'functional_currency', type: DataType.STRING(3) })
  declare functionalCurrency: string | null;
  @Column({ allowNull: true, field: 'functional_total_amount', type: DataType.DECIMAL(14, 3) })
  declare functionalTotalAmount: number | null;
  @Column({ allowNull: true, field: 'functional_tax_amount', type: DataType.DECIMAL(14, 3) })
  declare functionalTaxAmount: number | null;
  @Column({ allowNull: false, defaultValue: false, field: 'late_issue', type: DataType.BOOLEAN })
  declare lateIssue: boolean;
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

  @HasMany(() => TxnCreditNoteItem, { foreignKey: 'creditNoteId', sourceKey: 'creditNoteId', as: 'items' })
  declare items: TxnCreditNoteItem[];
}
