import { BelongsTo, Column, CreatedAt, DataType, Model, Scopes, Table, UpdatedAt } from 'sequelize-typescript';
import {
  getCreatedByUserInclude,
  getUpdatedByUserInclude,
  MstAdminUser,
  MstFranchise,
} from '@server_1/core';
import { MstPaymentMode, MstPaymentStatus, MstState } from '@server_1/platform';
import { InputLengthEnum, IWorkshopInvoiceAddress, TaxMode, TaxTypeEnum } from '@eatfit247-shared-lib';

const referenceIncludes = () => [
  getCreatedByUserInclude(false),
  getUpdatedByUserInclude(false),
  {
    model: MstFranchise,
    as: 'franchise',
    required: false,
    attributes: ['franchiseId', 'companyName', 'franchiseCode'],
  },
  {
    model: MstPaymentStatus,
    as: 'paymentStatus',
    required: false,
    attributes: ['paymentStatusId', 'paymentStatus'],
  },
  {
    model: MstPaymentMode,
    as: 'paymentMode',
    required: false,
    attributes: ['paymentModeId', 'paymentMode'],
  },
  {
    model: MstState,
    as: 'placeOfSupplyState',
    required: false,
    attributes: ['stateId', 'state', 'code'],
  },
];

@Table({
  freezeTableName: true,
  modelName: 'txn_workshop_invoices',
  schema: 'public',
  tableName: 'txn_workshop_invoices',
  indexes: [
    { unique: true, fields: ['invoice_id'], name: 'uq_txn_workshop_invoices_invoice_id' },
    { fields: ['franchise_id', 'invoice_date'], name: 'idx_txn_workshop_invoices_franchise_date' },
    { fields: ['payment_status_id'], name: 'idx_txn_workshop_invoices_payment_status' },
  ],
})
@Scopes(() => ({
  list: { include: referenceIncludes() },
  details: { include: referenceIncludes() },
}))
export class TxnWorkshopInvoice extends Model<TxnWorkshopInvoice> {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true, field: 'workshop_invoice_id' })
  declare workshopInvoiceId: number;

  @Column({ allowNull: false, field: 'franchise_id', type: DataType.INTEGER })
  declare franchiseId: number;

  @Column({ allowNull: true, field: 'invoice_id', type: DataType.STRING(100) })
  declare invoiceId: string | null;

  @Column({ allowNull: false, field: 'invoice_date', type: DataType.DATEONLY })
  declare invoiceDate: string;

  @Column({ allowNull: false, field: 'supply_date', type: DataType.DATEONLY })
  declare supplyDate: string;

  @Column({ allowNull: false, field: 'bill_to_name', type: DataType.STRING(200) })
  declare billToName: string;

  @Column({ allowNull: true, field: 'bill_to_contact_person', type: DataType.STRING(150) })
  declare billToContactPerson: string | null;

  @Column({ allowNull: true, field: 'bill_to_email', type: DataType.STRING(150) })
  declare billToEmail: string | null;

  @Column({ allowNull: true, field: 'bill_to_phone', type: DataType.STRING(25) })
  declare billToPhone: string | null;

  @Column({ allowNull: true, field: 'bill_to_gstin', type: DataType.STRING(15) })
  declare billToGstin: string | null;

  @Column({ allowNull: false, field: 'bill_to_address', type: DataType.JSONB })
  declare billToAddress: IWorkshopInvoiceAddress;

  @Column({ allowNull: false, field: 'bill_to_country_id', type: DataType.INTEGER })
  declare billToCountryId: number;

  @Column({ allowNull: false, field: 'bill_to_state_id', type: DataType.INTEGER })
  declare billToStateId: number;

  @Column({ allowNull: false, field: 'place_of_supply_state_id', type: DataType.INTEGER })
  declare placeOfSupplyStateId: number;

  @Column({ allowNull: false, field: 'description', type: DataType.STRING(500) })
  declare description: string;

  @Column({ allowNull: true, field: 'sac_code', type: DataType.STRING(10) })
  declare sacCode: string | null;

  @Column({ allowNull: false, field: 'quantity', type: DataType.INTEGER })
  declare quantity: number;

  @Column({ allowNull: false, field: 'unit_rate', type: DataType.DECIMAL(12, 2) })
  declare unitRate: number;

  @Column({ allowNull: false, field: 'order_amount', type: DataType.DECIMAL(12, 2) })
  declare orderAmount: number;

  @Column({ allowNull: false, field: 'discount_amount', type: DataType.DECIMAL(12, 2), defaultValue: 0 })
  declare discountAmount: number;

  @Column({ allowNull: false, field: 'tax_amount', type: DataType.DECIMAL(12, 2) })
  declare taxAmount: number;

  @Column({ allowNull: false, field: 'total_amount', type: DataType.DECIMAL(12, 2) })
  declare totalAmount: number;

  @Column({ allowNull: false, field: 'currency', type: DataType.STRING(3) })
  declare currency: string;

  @Column({ allowNull: true, field: 'tax_obj', type: DataType.JSONB })
  declare taxObj: Record<string, { amount: number; taxPercentage: number }> | null;

  @Column({ allowNull: true, field: 'tax_type', type: DataType.ENUM('GST', 'VAT', 'SALES_TAX', 'NONE') })
  declare taxType: TaxTypeEnum | null;

  @Column({
    allowNull: true,
    field: 'tax_mode',
    type: DataType.ENUM(
      'DOMESTIC_GST',
      'EXPORT_OF_SERVICE',
      'EXPORT_OF_GOODS',
      'VAT',
      'RCM_IMPORT_SERVICE',
      'SALES_TAX',
      'NO_TAX',
    ),
  })
  declare taxMode: TaxMode | null;

  @Column({ allowNull: true, field: 'tax_percentage', type: DataType.DECIMAL(5, 2) })
  declare taxPercentage: number | null;

  @Column({ allowNull: false, field: 'is_lut_applied', type: DataType.BOOLEAN, defaultValue: false })
  declare isLutApplied: boolean;

  @Column({ allowNull: true, field: 'jurisdiction', type: DataType.JSONB })
  declare jurisdiction: { entityCountry: string; customerCountry: string; placeOfSupply: string } | null;

  @Column({ allowNull: false, field: 'payment_status_id', type: DataType.INTEGER })
  declare paymentStatusId: number;

  @Column({ allowNull: true, field: 'payment_mode_id', type: DataType.INTEGER })
  declare paymentModeId: number | null;

  @Column({ allowNull: true, field: 'transaction_id', type: DataType.STRING(250) })
  declare transactionId: string | null;

  @Column({ allowNull: true, field: 'payment_date', type: DataType.DATEONLY })
  declare paymentDate: string | null;

  @Column({ allowNull: true, field: 'notes', type: DataType.TEXT })
  declare notes: string | null;

  @Column({ allowNull: true, field: 'cancel_reason', type: DataType.STRING(500) })
  declare cancelReason: string | null;

  @Column({ allowNull: false, field: 'active', type: DataType.BOOLEAN, defaultValue: true })
  declare active: boolean;

  @Column({ allowNull: false, field: 'created_by', type: DataType.INTEGER })
  declare createdBy: number;

  @Column({ allowNull: false, field: 'modified_by', type: DataType.INTEGER })
  declare modifiedBy: number;

  @Column({ allowNull: false, field: 'created_ip', type: DataType.STRING(InputLengthEnum.IP) })
  declare createdIp: string;

  @Column({ allowNull: false, field: 'modified_ip', type: DataType.STRING(InputLengthEnum.IP) })
  declare modifiedIp: string;

  @CreatedAt
  @Column({ allowNull: false, field: 'created_at', type: DataType.DATE, defaultValue: DataType.NOW })
  declare createdAt: Date;

  @UpdatedAt
  @Column({ allowNull: false, field: 'updated_at', type: DataType.DATE, defaultValue: DataType.NOW })
  declare updatedAt: Date;

  @BelongsTo(() => MstFranchise, { foreignKey: 'franchiseId', targetKey: 'franchiseId', as: 'franchise' })
  declare franchise: MstFranchise;

  @BelongsTo(() => MstPaymentStatus, { foreignKey: 'paymentStatusId', targetKey: 'paymentStatusId', as: 'paymentStatus' })
  declare paymentStatus: MstPaymentStatus;

  @BelongsTo(() => MstPaymentMode, { foreignKey: 'paymentModeId', targetKey: 'paymentModeId', as: 'paymentMode' })
  declare paymentMode: MstPaymentMode;

  @BelongsTo(() => MstState, { foreignKey: 'placeOfSupplyStateId', targetKey: 'stateId', as: 'placeOfSupplyState' })
  declare placeOfSupplyState: MstState;

  @BelongsTo(() => MstAdminUser, { foreignKey: 'createdBy', targetKey: 'adminId', as: 'createdByUser' })
  declare createdByUser: MstAdminUser;

  @BelongsTo(() => MstAdminUser, { foreignKey: 'modifiedBy', targetKey: 'adminId', as: 'updatedByUser' })
  declare updatedByUser: MstAdminUser;
}
