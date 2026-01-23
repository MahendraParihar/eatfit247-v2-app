import { BelongsTo, Column, CreatedAt, DataType, Model, Scopes, Table, UpdatedAt } from 'sequelize-typescript';
import { getCreatedByUserInclude, getUpdatedByUserInclude, MstAdminUser, MstFranchise } from '@server_1/core';
import { TaxTypeEnum, TransactionType } from '@eatfit247-shared-lib';

@Table({
  freezeTableName: true,
  modelName: 'mst_tax_master',
  schema: 'public',
  tableName: 'mst_tax_master',
  indexes: [
    {
      unique: true,
      fields: ['franchise_id', 'reference_id', 'country_code', 'tax_code', 'effective_from'],
      name: 'uq_tax_master',
    },
  ],
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


