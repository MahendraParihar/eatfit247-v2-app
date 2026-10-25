import { BelongsTo, Column, CreatedAt, DataType, Model, Scopes, Table, UpdatedAt } from 'sequelize-typescript';
import { getCreatedByUserInclude, getUpdatedByUserInclude, MstAdminUser, MstFranchise } from '@server_1/core';
import {
  TaxCategoryEnum,
  TaxTypeEnum,
  TransactionType,
} from '@eatfit247-shared-lib';

@Table({
  freezeTableName: true,
  modelName: 'mst_tax_master',
  schema: 'public',
  tableName: 'mst_tax_master',
  // ux_mst_tax_master_rule (migration 146) is an expression index over the precedence dimensions
  // + effective_from on active, non-fallback rules; it is maintained in SQL only.
})
@Scopes(() => ({
  list: {
    include: [
      getCreatedByUserInclude(false),
      getUpdatedByUserInclude(false),
    ],
  },
  details: {
    include: [
      getCreatedByUserInclude(false),
      getUpdatedByUserInclude(false),
    ],
  },
}))
export class MstTaxMaster extends Model<MstTaxMaster> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    field: 'id',
    autoIncrement: true,
  })
  declare id: number;

  @Column({
    allowNull: false,
    field: 'franchise_id',
    type: DataType.INTEGER,
  })
  declare franchiseId: number;

  @BelongsTo(() => MstFranchise, {
    foreignKey: 'franchiseId',
    targetKey: 'franchiseId',
    as: 'franchise',
  })
  declare franchise: MstFranchise;

  @Column({
    allowNull: false,
    field: 'reference_id',
    type: DataType.BIGINT,
  })
  declare referenceId: number;

  @Column({
    allowNull: false,
    field: 'country_code',
    type: DataType.STRING(3),
  })
  declare countryCode: string;

  @Column({
    allowNull: false,
    field: 'transaction_type',
    type: DataType.ENUM(...Object.values(TransactionType)),
  })
  declare transactionType: TransactionType;

  @Column({
    allowNull: false,
    field: 'tax_system',
    type: DataType.ENUM(...Object.values(TaxTypeEnum)),
  })
  declare taxSystem: TaxTypeEnum;

  @Column({
    allowNull: false,
    field: 'tax_code',
    type: DataType.STRING(50),
  })
  declare taxCode: string;

  @Column({
    allowNull: false,
    field: 'tax_name',
    type: DataType.STRING(100),
  })
  declare taxName: string;

  @Column({
    allowNull: false,
    field: 'tax_percent',
    type: DataType.DECIMAL(5, 2),
  })
  declare taxPercent: number;

  @Column({
    allowNull: false,
    defaultValue: 'SALE',
    field: 'apply_on',
    type: DataType.STRING(20),
  })
  declare applyOn: string;

  @Column({
    allowNull: false,
    defaultValue: false,
    field: 'is_tax_inclusive',
    type: DataType.BOOLEAN,
  })
  declare isTaxInclusive: boolean;

  @Column({
    allowNull: false,
    defaultValue: TaxCategoryEnum.STANDARD,
    field: 'tax_category',
    type: DataType.STRING(20),
  })
  declare taxCategory: TaxCategoryEnum;

  @Column({
    allowNull: true,
    field: 'hsn_sac_code',
    type: DataType.STRING(8),
  })
  declare hsnSacCode: string | null;

  @Column({
    allowNull: true,
    field: 'legal_basis',
    type: DataType.TEXT,
  })
  declare legalBasis: string | null;

  /** Conditions and treatment (spec 2026-10-25-configurable-tax-treatment, decisions 3 and 7; migration 146) */
  @Column({
    allowNull: false,
    defaultValue: 'SAME_COUNTRY',
    field: 'customer_scope',
    type: DataType.STRING(20),
  })
  declare customerScope: string;

  @Column({
    allowNull: true,
    field: 'place_of_supply_country_code',
    type: DataType.STRING(3),
  })
  declare placeOfSupplyCountryCode: string | null;

  @Column({
    allowNull: false,
    defaultValue: 'ANY',
    field: 'state_relation',
    type: DataType.STRING(10),
  })
  declare stateRelation: string;

  @Column({
    allowNull: false,
    defaultValue: 'ANY',
    field: 'registration_condition',
    type: DataType.STRING(15),
  })
  declare registrationCondition: string;

  @Column({
    allowNull: false,
    defaultValue: 'ANY',
    field: 'customer_type_condition',
    type: DataType.STRING(5),
  })
  declare customerTypeCondition: string;

  @Column({
    allowNull: false,
    defaultValue: 'ANY',
    field: 'electronic_condition',
    type: DataType.STRING(5),
  })
  declare electronicCondition: string;

  @Column({
    allowNull: false,
    defaultValue: 'ANY',
    field: 'money_condition',
    type: DataType.STRING(10),
  })
  declare moneyCondition: string;

  @Column({
    allowNull: false,
    defaultValue: 'SPECIFIC',
    field: 'applies_to',
    type: DataType.STRING(10),
  })
  declare appliesTo: string;

  @Column({
    allowNull: false,
    defaultValue: 'CHARGE',
    field: 'treatment',
    type: DataType.STRING(25),
  })
  declare treatment: string;

  @Column({
    allowNull: true,
    field: 'refusal_message',
    type: DataType.STRING(500),
  })
  declare refusalMessage: string | null;

  @Column({
    allowNull: true,
    field: 'invoice_note',
    type: DataType.TEXT,
  })
  declare invoiceNote: string | null;

  @Column({
    allowNull: false,
    defaultValue: false,
    field: 'requires_evidence',
    type: DataType.BOOLEAN,
  })
  declare requiresEvidence: boolean;

  @Column({
    allowNull: true,
    field: 'fallback_tax_master_id',
    type: DataType.INTEGER,
  })
  declare fallbackTaxMasterId: number | null;

  @Column({
    allowNull: false,
    defaultValue: false,
    field: 'fallback_only',
    type: DataType.BOOLEAN,
  })
  declare fallbackOnly: boolean;

  @Column({
    allowNull: false,
    field: 'effective_from',
    type: DataType.DATEONLY,
  })
  declare effectiveFrom: Date;

  @Column({
    allowNull: true,
    field: 'effective_to',
    type: DataType.DATEONLY,
  })
  declare effectiveTo: Date | null;

  @Column({
    allowNull: false,
    defaultValue: true,
    field: 'active',
    type: DataType.BOOLEAN,
  })
  declare active: boolean;

  @BelongsTo(() => MstAdminUser, {
    as: 'createdByUser',
    foreignKey: 'createdBy',
    targetKey: 'adminId',
  })
  declare createdByUser: MstAdminUser;

  @Column({
    allowNull: false,
    field: 'created_by',
    type: DataType.INTEGER,
  })
  declare createdBy: number;

  @CreatedAt
  @Column({
    allowNull: false,
    field: 'created_at',
  })
  declare createdAt: Date;

  @BelongsTo(() => MstAdminUser, {
    as: 'updatedByUser',
    foreignKey: 'modifiedBy',
    targetKey: 'adminId',
  })
  declare updatedByUser: MstAdminUser;

  @Column({
    allowNull: false,
    field: 'modified_by',
    type: DataType.INTEGER,
  })
  declare modifiedBy: number;

  @UpdatedAt
  @Column({
    allowNull: false,
    field: 'updated_at',
  })
  declare updatedAt: Date;

  @Column({
    allowNull: false,
    field: 'created_ip',
    type: DataType.STRING(255),
  })
  declare createdIp: string;

  @Column({
    allowNull: false,
    field: 'modified_ip',
    type: DataType.STRING(255),
  })
  declare modifiedIp: string;
}


