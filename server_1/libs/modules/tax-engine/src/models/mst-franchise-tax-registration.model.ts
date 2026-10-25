import { Column, CreatedAt, DataType, Model, Table, UpdatedAt } from 'sequelize-typescript';
import { TaxTypeEnum } from '@eatfit247-shared-lib';

/**
 * A tax registration of a franchise in one country (configurable tax treatment, decision 8; migration 146).
 * No active row effective on a date = unregistered on that date.
 */
@Table({
  freezeTableName: true,
  modelName: 'mst_franchise_tax_registrations',
  schema: 'public',
  tableName: 'mst_franchise_tax_registrations',
})
export class MstFranchiseTaxRegistration extends Model<MstFranchiseTaxRegistration> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'tax_registration_id',
  })
  declare taxRegistrationId: number;

  @Column({ allowNull: false, field: 'franchise_id', type: DataType.INTEGER })
  declare franchiseId: number;

  @Column({ allowNull: false, field: 'country_code', type: DataType.STRING(3) })
  declare countryCode: string;

  @Column({ allowNull: false, field: 'tax_system', type: DataType.ENUM(...Object.values(TaxTypeEnum)) })
  declare taxSystem: TaxTypeEnum;

  @Column({ allowNull: false, field: 'registration_number', type: DataType.STRING(50) })
  declare registrationNumber: string;

  /** GST: the registration's State, in the `mst_states.code` form */
  @Column({ allowNull: true, field: 'state_code', type: DataType.STRING(10) })
  declare stateCode: string | null;

  @Column({ allowNull: true, field: 'iec_number', type: DataType.STRING(10) })
  declare iecNumber: string | null;

  @Column({ allowNull: false, field: 'currency_code', type: DataType.STRING(3) })
  declare currencyCode: string;

  @Column({ allowNull: false, field: 'effective_from', type: DataType.DATEONLY })
  declare effectiveFrom: string;

  @Column({ allowNull: true, field: 'effective_to', type: DataType.DATEONLY })
  declare effectiveTo: string | null;

  @Column({ allowNull: true, field: 'invoice_prefix', type: DataType.STRING(5) })
  declare invoicePrefix: string | null;

  @Column({ allowNull: true, field: 'invoice_number_format', type: DataType.STRING(40) })
  declare invoiceNumberFormat: string | null;

  @Column({ allowNull: true, field: 'fy_start_month', type: DataType.SMALLINT })
  declare fyStartMonth: number | null;

  @Column({ allowNull: false, defaultValue: true, field: 'active', type: DataType.BOOLEAN })
  declare active: boolean;

  @Column({ allowNull: false, field: 'created_by', type: DataType.INTEGER })
  declare createdBy: number;

  @Column({ allowNull: false, field: 'modified_by', type: DataType.INTEGER })
  declare modifiedBy: number;

  @CreatedAt
  @Column({ allowNull: false, field: 'created_at' })
  declare createdAt: Date;

  @UpdatedAt
  @Column({ allowNull: false, field: 'updated_at' })
  declare updatedAt: Date;

  @Column({ allowNull: false, field: 'created_ip', type: DataType.STRING(50) })
  declare createdIp: string;

  @Column({ allowNull: false, field: 'modified_ip', type: DataType.STRING(50) })
  declare modifiedIp: string;
}
